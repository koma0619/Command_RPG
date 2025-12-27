import type { Actor, Skill } from '../types/battleTypes';
import type { SkillId } from '../types/skillIds';
import { SKILLS } from '../data/skillData';

/** Action はそのターンに行う行動（誰が何を行うか）を表します。 */
export interface Action {
  actor: Actor;
  skillName: SkillId;
  targetIds?: string[];
  isAuto?: boolean;
}

/** TurnEntry はターン開始時点での行動順決定用のエントリ。 */
export interface TurnEntry {
  actor: Actor;
  skillName?: SkillId;
}

/** スキル名から優先度を取得（未定義は 0）。 */
export const getSkillPriority = (skillName: SkillId): number => {
  const s: Skill | undefined = SKILLS[skillName];
  if (!s) return 0;
  return typeof s.priority === 'number' ? s.priority : 0;
};

/**
 * 行動配列を実行順にソートして返す。
 * ソート基準:
 * 1) skill.priority（数値高いほど先）
 * 2) actor.spd（高いほど先）
 * 3) 上記同値はランダム（公平なタイブレーク）
 */
export const determineTurnOrder = (
  entries: TurnEntry[],
  rng: () => number = Math.random
): TurnEntry[] => {
  // attach tie-breaker random value
  const withRand = entries.map(entry => ({
    entry,
    priority: entry.skillName ? getSkillPriority(entry.skillName) : 0,
    spd: entry.actor.spd,
    rand: rng()
  }));

  withRand.sort((x, y) => {
    if (y.priority !== x.priority) return y.priority - x.priority;
    if (y.spd !== x.spd) return y.spd - x.spd;
    return y.rand - x.rand;
  });

  return withRand.map(w => w.entry);
};

/** ヘルパー: 行動順をわかりやすい文字列配列で返す */
export const formatOrder = (ordered: TurnEntry[]): string[] => {
  return ordered.map(o => `${o.actor.emoji ?? ''}${o.actor.name} -> ${o.skillName ?? 'auto'}`);
};

export default {
  determineTurnOrder,
  getSkillPriority,
  formatOrder
};
