import { determineTurnOrder, type Action, type TurnEntry } from './turnOrder';
import { resolveActions, type ResolveEvent } from './actionResolver';
import { SKILLS } from '../data/skillData';
import type { BattleActor } from '../types/battleTypes';
import type { QueuedAction } from '../types/queuedAction';
import StatusManager from './statusManager';

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
  targetIds?: string[],
  isAuto = false
): Action => {
  const skill = SKILLS[skillId];
  const cost = skill.mpCost ?? 0;
  const mpAfter = Math.max(0, battleActor.currentMp - cost);
  mpSpent.set(battleActor.actor.name, cost);
  return {
    actor: { ...battleActor.actor, hp: battleActor.currentHp, mp: mpAfter },
    skillName: skill.id,
    targetIds,
    isAuto,
  };
};

const buildPlayerActions = (
  queue: QueuedAction[],
  playerTeam: BattleActor[],
  enemyTeam: BattleActor[],
  mpSpent: Map<string, number>
): Action[] => {
  const actors = [...playerTeam, ...enemyTeam];
  return queue
    .map(entry => {
      const battleActor = actors.find(a => a.actor.name === entry.actorId);
      if (!battleActor) return null;
      return buildAction(battleActor, entry.skillId, mpSpent, entry.targetIds);
    })
    .filter((action): action is Action => action !== null);
};

const mapActorsForResolution = (
  team: BattleActor[],
  mpSpent: Map<string, number>
) => {
  return team.map(ba => {
    const cost = mpSpent.get(ba.actor.name) ?? 0;
    return {
      ...ba.actor,
      hp: ba.currentHp,
      mp: Math.max(0, ba.currentMp - cost),
      maxHp: ba.actor.hp,
    };
  });
};

const applyResultsToTeam = (
  team: BattleActor[],
  resultMap: Map<string, { hp: number; mp: number }>
): BattleActor[] =>
  team.map(ba => {
    const updated = resultMap.get(ba.actor.name);
    return {
      ...ba,
      currentHp: updated?.hp ?? ba.currentHp,
      currentMp: Math.max(0, updated?.mp ?? ba.currentMp),
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
  const playerActionMap = new Map(playerActions.map(action => [action.actor.name, action]));
  const turnEntries: TurnEntry[] = [...playerTeam, ...enemyTeam]
    .filter(actor => actor.currentHp > 0)
    .map(battleActor => ({
      actor: {
        ...battleActor.actor,
        hp: battleActor.currentHp,
        mp: battleActor.currentMp,
      },
      skillName: playerActionMap.get(battleActor.actor.name)?.skillName,
    }));
  const orderedEntries = determineTurnOrder(turnEntries, rng);
  const orderedActions = orderedEntries.map(entry => {
    return (
      playerActionMap.get(entry.actor.name) ?? {
        actor: entry.actor,
        skillName: 'attack',
        isAuto: true,
      }
    );
  });

  const actorsForResolution = [
    ...mapActorsForResolution(playerTeam, mpSpent),
    ...mapActorsForResolution(enemyTeam, mpSpent),
  ];

  const results = resolveActions(orderedActions, actorsForResolution, statusManager, rng);
  const resultMap = new Map(results.actors.map(actor => [actor.name, actor]));

  statusManager.tickTurn();

  const nextPlayerTeam = applyResultsToTeam(playerTeam, resultMap);
  const nextEnemyTeam = applyResultsToTeam(enemyTeam, resultMap);

  return {
    nextPlayerTeam,
    nextEnemyTeam,
    events: results.events,
    enemiesDefeated: nextEnemyTeam.every(e => e.currentHp <= 0),
    playersDefeated: nextPlayerTeam.every(p => p.currentHp <= 0),
  };
};
