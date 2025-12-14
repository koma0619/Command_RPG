import type { Actor, Skill } from '../types/battleTypes';
import type { SkillId } from '../types/skillIds';
import { SKILLS } from '../data/skillData';
import StatusManager from './statusManager';
import type { Action } from './turnOrder';
// StatusEffect 型は直接は使わないが将来の拡張のために保留（未使用を避けるためコメントアウト）
// import type { StatusEffect } from './statusManager';

/** 逆効果マップ: デバフが付与されるときに相手のバフを解除するための対応表 */
const opposite: Record<string, string | undefined> = {
  atk_down: 'atk_up',
  def_down: 'def_up'
};

export type ResolveEvent = {
  actorId: string;
  actorName: string;
  skill: SkillId;
  targetIds: string[];
  kind: 'damage' | 'heal' | 'apply_buff' | 'remove_buff' | 'revive' | 'miss' | 'other';
  value?: number;
  detail?: string;
};

/**
 * 簡易行動解決関数
 * - actions は実行順に並んだ Action[]（determineTurnOrder の返り値）
 * - actors は全アクター（攻撃者・被攻撃者）を含む配列。オブジェクトはミューテートされる。
 * - sm は StatusManager インスタンス
 */
export const resolveActions = (
  actions: Action[],
  actors: Actor[],
  sm: StatusManager
): { actors: Actor[]; events: ResolveEvent[] } => {
  const events: ResolveEvent[] = [];
  const actorMap = new Map<string, Actor>();
  for (const a of actors) actorMap.set(a.name, a);

  const pickTarget = (user: Actor, targetType: Skill['target'], override?: string[]): Actor[] => {
    if (override && override.length > 0) {
      return override
        .map(id => actorMap.get(id))
        .filter((t): t is Actor => !!t && t.hp > 0);
    }

    const all = Array.from(actorMap.values());
    const enemies = all.filter(x => x.isEnemy !== user.isEnemy && x.hp > 0);
    const allies = all.filter(x => x.isEnemy === user.isEnemy && x.hp > 0);

    if (targetType === 'self') return [user];
    if (targetType === 'ally_single') return allies.length ? [allies[0]] : [];
    if (targetType === 'ally_all') return allies;
    if (targetType === 'enemy_single') return enemies.length ? [enemies[0]] : [];
    if (targetType === 'enemy_all') return enemies;
    return [];
  };

  for (const act of actions) {
    const attacker = actorMap.get(act.actor.name);
    if (!attacker || attacker.hp <= 0) continue; // dead can't act

    const skill = SKILLS[act.skillName];

    const targets = pickTarget(attacker, skill.target, act.targetIds);

    if (skill.type === 'buff') {
      // apply buff to targets
      for (const t of targets) {
        const res = sm.addEffectBySkill(t.name, act.skillName);
        if (res.applied) events.push({ actorId: attacker.name, actorName: attacker.name, skill: act.skillName, targetIds: [t.name], kind: 'apply_buff' });
        else events.push({ actorId: attacker.name, actorName: attacker.name, skill: act.skillName, targetIds: [t.name], kind: 'other', detail: res.reason });
      }
      continue;
    }

    if (skill.type === 'debuff' || skill.type === 'attack_debuff') {
      for (const t of targets) {
        // check and remove opposite buff first
        if (skill.effect) {
          const opp = opposite[skill.effect.key];
          if (opp && sm.hasEffect(t.name, { ...skill.effect, key: opp } as any)) {
            const removed = sm.removeEffect(t.name, opp);
            events.push({ actorId: attacker.name, actorName: attacker.name, skill: act.skillName, targetIds: [t.name], kind: 'remove_buff', value: removed.length, detail: opp });
          } else {
            const res = sm.addEffectBySkill(t.name, act.skillName);
            if (res.applied) events.push({ actorId: attacker.name, actorName: attacker.name, skill: act.skillName, targetIds: [t.name], kind: 'apply_buff' });
            else events.push({ actorId: attacker.name, actorName: attacker.name, skill: act.skillName, targetIds: [t.name], kind: 'other', detail: res.reason });
          }
        }
      }
      // if it's also an attack (attack_debuff), fallthrough to damage handling below
      if (skill.type !== 'attack_debuff') continue;
    }

    // damage/heal/other
    if (skill.type.startsWith('attack')) {
      // handle hits
      const hits = skill.hits ?? 1;
      for (let h = 0; h < hits; h++) {
        for (const t of targets) {
          if (t.hp <= 0) continue;
          let damage = 0;
          if (skill.type === 'attack_magic') {
            // magic uses fixed power and ignores DEF; magic_shield reduces
            damage = Math.round(skill.power ?? 0);
            // apply magic shield from status manager
            const mod = sm.computeModifiedStats({ atk: t.atk, def: t.def, spd: t.spd }, t.name);
            damage = Math.max(0, Math.round(damage * mod.magicShield));
          } else {
            // physical style
            const power = skill.power ?? 1;
            damage = Math.max(1, Math.round(attacker.atk * power - t.def));
          }

          t.hp = Math.max(0, t.hp - damage);
          events.push({ actorId: attacker.name, actorName: attacker.name, skill: act.skillName, targetIds: [t.name], kind: 'damage', value: damage });

          // drain
          if (skill.drain) {
            const heal = Math.round(damage * skill.drain);
            attacker.hp += heal;
            events.push({ actorId: attacker.name, actorName: attacker.name, skill: act.skillName, targetIds: [attacker.name], kind: 'heal', value: heal });
          }

          // gamble miss handling
          if (skill.chance !== undefined && Math.random() > skill.chance) {
            events.push({ actorId: attacker.name, actorName: attacker.name, skill: act.skillName, targetIds: [t.name], kind: 'miss' });
          }
        }
      }
      continue;
    }

    if (skill.type === 'heal' || skill.type === 'heal_regen') {
      for (const t of targets) {
        const amount = Math.round(skill.power ?? 0);
        t.hp = t.hp + amount;
        events.push({ actorId: attacker.name, actorName: attacker.name, skill: act.skillName, targetIds: [t.name], kind: 'heal', value: amount });
      }
      continue;
    }

    if (skill.type === 'revive' || skill.type === 'mega_revive') {
      for (const t of targets) {
        if (t.hp <= 0) {
          const revivedHp = Math.max(1, Math.round((t.hp || 0) + 30));
          t.hp = revivedHp;
          events.push({ actorId: attacker.name, actorName: attacker.name, skill: act.skillName, targetIds: [t.name], kind: 'revive', value: revivedHp });
        } else {
          events.push({ actorId: attacker.name, actorName: attacker.name, skill: act.skillName, targetIds: [t.name], kind: 'other', detail: 'target_not_dead' });
        }
      }
      continue;
    }

    // default fallback
    events.push({ actorId: attacker.name, actorName: attacker.name, skill: act.skillName, targetIds: targets.map(t => t.name), kind: 'other' });
  }

  return { actors: Array.from(actorMap.values()), events };
};

export default { resolveActions };
