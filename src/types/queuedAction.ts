import type { SkillId } from './skillIds';

export interface QueuedAction {
  actorId: string;
  skillId: SkillId;
  targetIds?: string[];
}
