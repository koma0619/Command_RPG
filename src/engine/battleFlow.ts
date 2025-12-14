import { determineTurnOrder, type Action } from './turnOrder';
import { resolveActions, type ResolveEvent } from './actionResolver';
import { SKILLS } from '../data/skillData';
import type { BattleActor } from '../types/battleTypes';
import type { QueuedAction } from '../types/queuedAction';
import StatusManager from './statusManager';

interface BuildActionResult {
  action: Action;
  actorAfterMp: number;
}

export interface ExecuteBattleTurnParams {
  playerTeam: BattleActor[];
  enemyTeam: BattleActor[];
  actionQueue: QueuedAction[];
  statusManager: StatusManager;
  rng?: () => number;
}

export interface ExecuteBattleTurnResult {
  nextPlayerTeam: BattleActor[];
  nextEnemyTeam: BattleActor[];
  events: ResolveEvent[];
  enemiesDefeated: boolean;
  playersDefeated: boolean;
}

export const ensureAllPlayersQueued = (
  players: BattleActor[],
  queue: QueuedAction[]
): string | null => {
  const alivePlayers = players.filter(p => p.currentHp > 0);
  if (queue.length < alivePlayers.length) {
    return '全員のコマンドを入力してください';
  }
  return null;
};

const buildAction = (
  battleActor: BattleActor,
  skillId: QueuedAction['skillId'],
  mpSpent: Map<string, number>,
  targetIds?: string[]
): BuildActionResult => {
  const skill = SKILLS[skillId];
  const cost = skill.mpCost ?? 0;
  const mpAfter = Math.max(0, battleActor.currentMp - cost);
  mpSpent.set(battleActor.actor.name, cost);
  return {
    action: {
      actor: { ...battleActor.actor, hp: battleActor.currentHp, mp: mpAfter },
      skillName: skill.id,
      targetIds,
    },
    actorAfterMp: mpAfter,
  };
};

const buildPlayerActions = (
  queue: QueuedAction[],
  playerTeam: BattleActor[],
  enemyTeam: BattleActor[],
  mpSpent: Map<string, number>
): BuildActionResult[] => {
  const actors = [...playerTeam, ...enemyTeam];
  return queue
    .map(entry => {
      const battleActor = actors.find(a => a.actor.name === entry.actorId);
      if (!battleActor) return null;
      return buildAction(battleActor, entry.skillId, mpSpent, entry.targetIds);
    })
    .filter((action): action is BuildActionResult => action !== null);
};

const buildEnemyActions = (
  enemyTeam: BattleActor[],
  playerTeam: BattleActor[],
  mpSpent: Map<string, number>,
  rng: () => number
): BuildActionResult[] => {
  const aliveTargets = playerTeam.filter(p => p.currentHp > 0);
  return enemyTeam
    .filter(enemy => enemy.currentHp > 0)
    .map(enemy => {
      const target =
        aliveTargets.length > 0
          ? aliveTargets[Math.floor(rng() * aliveTargets.length)]
          : null;
      return buildAction(enemy, 'attack', mpSpent, target ? [target.actor.name] : undefined);
    });
};

const mapActorsForResolution = (
  team: BattleActor[],
  mpSpent: Map<string, number>
) => {
  return team.map(ba => {
    const cost = mpSpent.get(ba.actor.name) ?? 0;
    return { ...ba.actor, hp: ba.currentHp, mp: Math.max(0, ba.currentMp - cost) };
  });
};

const applyResultsToTeam = (
  team: BattleActor[],
  resultMap: Map<string, { hp: number; mp: number }>,
  mpSpent: Map<string, number>
): BattleActor[] =>
  team.map(ba => {
    const updated = resultMap.get(ba.actor.name);
    const mpCost = mpSpent.get(ba.actor.name) ?? 0;
    return {
      ...ba,
      currentHp: updated?.hp ?? ba.currentHp,
      currentMp: Math.max(0, (updated?.mp ?? ba.currentMp) - mpCost),
    };
  });

export const executeBattleTurn = ({
  playerTeam,
  enemyTeam,
  actionQueue,
  statusManager,
  rng = Math.random,
}: ExecuteBattleTurnParams): ExecuteBattleTurnResult => {
  const mpSpent = new Map<string, number>();

  const playerActions = buildPlayerActions(actionQueue, playerTeam, enemyTeam, mpSpent);
  const enemyActions = buildEnemyActions(enemyTeam, playerTeam, mpSpent, rng);
  const allActionObjects = [...playerActions, ...enemyActions];
  const orderedActions = determineTurnOrder(allActionObjects.map(a => a.action));

  const actorsForResolution = [
    ...mapActorsForResolution(playerTeam, mpSpent),
    ...mapActorsForResolution(enemyTeam, mpSpent),
  ];

  const results = resolveActions(orderedActions, actorsForResolution, statusManager);
  const resultMap = new Map(results.actors.map(actor => [actor.name, actor]));

  statusManager.tickTurn();

  const nextPlayerTeam = applyResultsToTeam(playerTeam, resultMap, mpSpent);
  const nextEnemyTeam = applyResultsToTeam(enemyTeam, resultMap, mpSpent);

  return {
    nextPlayerTeam,
    nextEnemyTeam,
    events: results.events,
    enemiesDefeated: nextEnemyTeam.every(e => e.currentHp <= 0),
    playersDefeated: nextPlayerTeam.every(p => p.currentHp <= 0),
  };
};
