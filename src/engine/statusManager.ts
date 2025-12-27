import type { BuffEffect } from '../types/battleTypes';
import type { SkillId } from '../types/skillIds';
import { SKILLS } from '../data/skillData';

/** ステータス効果（バフ/デバフ）の内部表現 */
export interface StatusEffect {
  id: string;
  ownerId: string; // 対象 Actor の name
  sourceSkill: string;
  effect: BuffEffect;
  remainingTurns: number;
  stackable: boolean;
}

/** 管理クラス: 各アクターごとの効果を保持し追加・更新・ターン経過処理を行う */
export class StatusManager {
  private effects: Map<string, StatusEffect[]> = new Map();

  /** 全ての効果を取得（コピー） */
  public getEffects(ownerId: string): StatusEffect[] {
    return (this.effects.get(ownerId) || []).map(e => ({ ...e }));
  }

  /** 指定効果が既に付与されているか */
  public hasEffect(ownerId: string, effect: BuffEffect): boolean {
    const arr = this.effects.get(ownerId) || [];
    return arr.some(e => e.effect.key === effect.key && e.remainingTurns > 0);
  }

  /**
   * スキル名を元に効果を追加するユーティリティ。
   * stackable=false の場合、同一 effect が既にあると追加は失敗して false を返す。
   */
  public addEffectBySkill(ownerId: string, skillName: SkillId): { applied: boolean; reason?: string } {
    const s = SKILLS[skillName];
    if (!s) return { applied: false, reason: 'skill_not_found' };
    if (!s.effect) return { applied: false, reason: 'skill_has_no_effect' };

    const effect = s.effect;
    const duration = effect.duration ?? 0;
    const stackable = s.stackable === undefined ? true : !!s.stackable;

    if (duration <= 0) {
      // 短期効果（持続が無い場合）はステータスに永続的に乗らないため適用不可とする
      return { applied: false, reason: 'no_duration' };
    }

    // 非重複バフは既存に同一エフェクトがある場合適用不可
    if (!stackable) {
      const existing = this.effects.get(ownerId) || [];
      if (existing.some(e => e.effect.key === effect.key && e.remainingTurns > 0)) {
        return { applied: false, reason: 'already_exists' };
      }
    }

    const id = `${ownerId}_${skillName}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,5)}`;
    const eff: StatusEffect = {
      id,
      ownerId,
      sourceSkill: skillName,
      effect,
      remainingTurns: duration,
      stackable
    };

    const arr = this.effects.get(ownerId) || [];
    arr.push(eff);
    this.effects.set(ownerId, arr);
    return { applied: true };
  }

  /** ターン経過: 全効果の remainingTurns をデクリメントし、消滅した効果を削除する */
  public tickTurn(): { removed: StatusEffect[] } {
    const removed: StatusEffect[] = [];
    for (const [ownerId, arr] of this.effects.entries()) {
      const remaining: StatusEffect[] = [];
      for (const e of arr) {
        const next = { ...e, remainingTurns: e.remainingTurns - 1 };
        if (next.remainingTurns > 0) remaining.push(next);
        else removed.push({ ...e, remainingTurns: 0 });
      }
      if (remaining.length > 0) this.effects.set(ownerId, remaining);
      else this.effects.delete(ownerId);
    }
    return { removed };
  }

  /** 全ての効果を消す（テスト用など） */
  public clear(): void {
    this.effects.clear();
  }

  /** 指定の effect タイプ（例: 'atk_up'）を削除する */
  public removeEffect(ownerId: string, effectKey: string, kind?: BuffEffect['kind']): StatusEffect[] {
    const arr = this.effects.get(ownerId) || [];
    const removed: StatusEffect[] = [];
    const remaining = arr.filter(e => {
      if (e.effect.key === effectKey && (!kind || e.effect.kind === kind)) {
        removed.push(e);
        return false;
      }
      return true;
    });
    if (remaining.length > 0) this.effects.set(ownerId, remaining);
    else this.effects.delete(ownerId);
    return removed;
  }

  /**
   * 指定アクターの修正後ステータスを計算して返す。
   * atk/def/spd はバフ・デバフを乗算（value が 1 以上のときは倍率、と想定）、
   * spd の value が 1 未満の場合は加算量と解釈する（互換性のため）。
   */
  public computeModifiedStats(actor: { atk: number; def: number; spd: number }, ownerId: string) {
    let atk = actor.atk;
    let def = actor.def;
    let spd = actor.spd;
    let magicShield = 1; // multiplier for magic damage (1 = no change, 0.5 => half)

    const arr = this.effects.get(ownerId) || [];
    for (const e of arr) {
      switch (e.effect.key) {
        case 'atk':
          if (e.effect.kind === 'buff') atk = Math.max(0, Math.round(atk * e.effect.value));
          else if (e.effect.kind === 'debuff') atk = Math.max(0, Math.round(atk / e.effect.value));
          break;
        case 'def':
          if (e.effect.kind === 'buff') def = Math.max(0, Math.round(def * e.effect.value));
          else if (e.effect.kind === 'debuff') def = Math.max(0, Math.round(def / e.effect.value));
          break;
        case 'spd':
          if (e.effect.value >= 1) spd = Math.max(0, Math.round(spd * e.effect.value));
          else spd = Math.max(0, spd + Math.round(e.effect.value));
          break;
        case 'magic_shield':
          magicShield = Math.min(magicShield, e.effect.value);
          break;
        default:
          break;
      }
    }

    return { atk, def, spd, magicShield };
  }
}

export default StatusManager;
