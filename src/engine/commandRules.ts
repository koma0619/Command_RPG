import { SKILLS } from '../data/skillData';
import type { BattleActor, SkillTargetType } from '../types/battleTypes';
import type { SkillId } from '../types/skillIds';
import type { QueuedAction } from '../types/queuedAction';

export interface TargetPrompt {
  actorId: string;
  skillId: SkillId;
  targetType: SkillTargetType;
}

export const getSkillLabel = (skillId: SkillId): string =>
  SKILLS[skillId]?.name ?? skillId;

export const getAliveActors = (team: BattleActor[]): BattleActor[] =>
  team.filter(member => member.currentHp > 0);

export const buildPendingActions = (queue: QueuedAction[]): Map<string, string> =>
  queue.reduce((map, entry) => {
    map.set(entry.actorId, getSkillLabel(entry.skillId));
    return map;
  }, new Map<string, string>());

export const validateSkillSelection = ({
  actor,
  skillId,
  actionQueue,
}: {
  actor: BattleActor;
  skillId: SkillId;
  actionQueue: QueuedAction[];
}): string | null => {
  if (actionQueue.some(action => action.actorId === actor.actor.name)) {
    return `${actor.actor.name}は既に行動を選択済みです`;
  }

  const skill = SKILLS[skillId];
  if (!skill) {
    return 'スキルが見つかりません';
  }

  const cost = skill.mpCost ?? 0;
  if (actor.currentMp < cost) {
    return `${actor.actor.name}はMPが足りない`;
  }

  return null;
};

export const resolveAutoTargets = ({
  actorId,
  skillId,
  playerTeam,
  enemyTeam,
}: {
  actorId: string;
  skillId: SkillId;
  playerTeam: BattleActor[];
  enemyTeam: BattleActor[];
}): string[] | null => {
  const skill = SKILLS[skillId];
  if (!skill) return null;

  if (skill.target === 'ally_all') {
    return getAliveActors(playerTeam).map(member => member.actor.name);
  }
  if (skill.target === 'enemy_all') {
    return getAliveActors(enemyTeam).map(member => member.actor.name);
  }
  if (skill.target === 'self') {
    return [actorId];
  }

  return null;
};

export const buildTargetPrompt = (actorId: string, skillId: SkillId): TargetPrompt | null => {
  const skill = SKILLS[skillId];
  if (!skill) return null;
  if (skill.target === 'ally_single' || skill.target === 'enemy_single') {
    return { actorId, skillId, targetType: skill.target };
  }
  return null;
};

export const getTargetCandidates = (
  targetPrompt: TargetPrompt | null,
  playerTeam: BattleActor[],
  enemyTeam: BattleActor[]
): BattleActor[] => {
  if (!targetPrompt) return [];
  if (targetPrompt.targetType.startsWith('enemy')) {
    return getAliveActors(enemyTeam);
  }
  return getAliveActors(playerTeam);
};
