import type { Actor, Skill } from '../types/battleTypes';
import type { SkillId } from '../types/skillIds';
import { SKILLS } from '../data/skillData';
import StatusManager from './statusManager';
import type { Action } from './turnOrder';
// StatusEffect 型は直接は使わないが将来の拡張のために保留（未使用を避けるためコメントアウト）
// import type { StatusEffect } from './statusManager';

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
 * - actions は実行順に並んだ Action[]（determineTurnOrder で決めた順）
 * - actors は全アクター（攻撃者・被攻撃者）を含む配列。オブジェクトはミューテートされる。
 * - sm は StatusManager インスタンス
 */
export const resolveActions = (
  actions: Action[],
  actors: Actor[],
  sm: StatusManager,
  rng: () => number = Math.random
): { actors: Actor[]; events: ResolveEvent[] } => {
  const events: ResolveEvent[] = [];
  const actorMap = new Map<string, Actor>();
  for (const a of actors) actorMap.set(a.name, a);

  const clampHp = (actor: Actor, nextHp: number) => {
    const maxHp = actor.maxHp ?? actor.hp;
    return Math.min(maxHp, nextHp);
  };

  const pickRandom = <T>(items: T[]): T | null => {
    if (items.length === 0) return null;
    return items[Math.floor(rng() * items.length)];
  };

  const pickTarget = (user: Actor, targetType: Skill['target'], override?: string[]): Actor[] => {
    if (override?.length) {
      return override
        .map(id => actorMap.get(id))
        .filter((t): t is Actor => !!t && t.hp > 0);
    }

    const all = Array.from(actorMap.values());
    const enemies = all.filter(x => x.isEnemy !== user.isEnemy && x.hp > 0);
    const allies = all.filter(x => x.isEnemy === user.isEnemy && x.hp > 0);

    if (targetType === 'self') return [user];
    if (targetType === 'ally_single') {
      const target = pickRandom(allies);
      return target ? [target] : [];
    }
    if (targetType === 'ally_all') return allies;
    if (targetType === 'enemy_single') {
      const target = pickRandom(enemies);
      return target ? [target] : [];
    }
    if (targetType === 'enemy_all') return enemies;
    return [];
  };

  const chooseAutoSkill = (user: Actor): SkillId => {
    const candidates = new Set<SkillId>(user.skills);
    candidates.add('attack');
    const usable = Array.from(candidates).filter(id => {
      const skill = SKILLS[id];
      if (!skill) return false;
      const cost = skill.mpCost ?? 0;
      return user.mp >= cost;
    });
    if (usable.length === 0) return 'attack';
    return usable[Math.floor(rng() * usable.length)];
  };

  for (const act of actions) {
    const attacker = actorMap.get(act.actor.name);
    if (!attacker || attacker.hp <= 0) continue; // dead can't act

    const skillId = act.isAuto ? chooseAutoSkill(attacker) : act.skillName;
    const skill = SKILLS[skillId];
    if (!skill) continue;
    if (act.isAuto) {
      const cost = skill.mpCost ?? 0;
      attacker.mp = Math.max(0, attacker.mp - cost);
    }

    const emit = (
      kind: ResolveEvent['kind'],
      targetIds: string[],
      value?: number,
      detail?: string
    ) => {
      events.push({
        actorId: attacker.name,
        actorName: attacker.name,
        skill: skillId,
        targetIds,
        kind,
        value,
        detail,
      });
    };

    const targets = pickTarget(attacker, skill.target, act.targetIds);

    if (skill.type === 'buff') {
      // apply buff to targets
      for (const t of targets) {
        const res = sm.addEffectBySkill(t.name, skillId);
        if (res.applied) emit('apply_buff', [t.name]);
        else emit('other', [t.name], undefined, res.reason);
      }
      continue;
    }

    if (skill.type === 'debuff' || skill.type === 'attack_debuff') {
      for (const t of targets) {
        if (skill.effect) {
          const conflictKind = skill.effect.kind === 'debuff' ? 'buff' : skill.effect.kind === 'buff' ? 'debuff' : undefined;
          if (conflictKind) {
            const removed = sm.removeEffect(t.name, skill.effect.key, conflictKind);
            if (removed.length > 0) {
              emit('remove_buff', [t.name], removed.length, skill.effect.key);
            }
          }

          const res = sm.addEffectBySkill(t.name, skillId);
          if (res.applied) {
            emit('apply_buff', [t.name]);
          } else {
            emit('other', [t.name], undefined, res.reason);
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
          emit('damage', [t.name], damage);

          // drain
          if (skill.drain) {
            const heal = Math.round(damage * skill.drain);
            attacker.hp = clampHp(attacker, attacker.hp + heal);
            emit('heal', [attacker.name], heal);
          }

          // gamble miss handling
          if (skill.chance !== undefined && rng() > skill.chance) {
            emit('miss', [t.name]);
          }
        }
      }
      continue;
    }

    if (skill.type === 'heal' || skill.type === 'heal_regen') {
      for (const t of targets) {
        const amount = Math.round(skill.power ?? 0);
        t.hp = clampHp(t, t.hp + amount);
        emit('heal', [t.name], amount);
      }
      continue;
    }

    if (skill.type === 'revive' || skill.type === 'mega_revive') {
      for (const t of targets) {
        if (t.hp <= 0) {
          const revivedHp = Math.max(1, Math.round((t.hp || 0) + 30));
          t.hp = clampHp(t, revivedHp);
          emit('revive', [t.name], revivedHp);
        } else {
          emit('other', [t.name], undefined, 'target_not_dead');
        }
      }
      continue;
    }

    // default fallback
    emit('other', targets.map(t => t.name));
  }

  return { actors: Array.from(actorMap.values()), events };
};

export default { resolveActions };
