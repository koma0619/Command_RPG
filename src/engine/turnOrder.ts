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
export const determineTurnOrder = (actions: Action[]): Action[] => {
  // attach tie-breaker random value
  const withRand = actions.map(a => ({
    a,
    priority: getSkillPriority(a.skillName),
    spd: a.actor.spd,
    rand: Math.random()
  }));

  withRand.sort((x, y) => {
    if (y.priority !== x.priority) return y.priority - x.priority;
    if (y.spd !== x.spd) return y.spd - x.spd;
    return y.rand - x.rand;
  });

  return withRand.map(w => w.a);
};

/** ヘルパー: 行動順をわかりやすい文字列配列で返す */
export const formatOrder = (ordered: Action[]): string[] => {
  return ordered.map(o => `${o.actor.emoji ?? ''}${o.actor.name} -> ${o.skillName}`);
};

export default {
  determineTurnOrder,
  getSkillPriority,
  formatOrder
};
