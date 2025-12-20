import React from 'react';
import { createInitialPlayerTeam, generateRandomEnemyTeam } from '../data/characterData';
import { executeBattleTurn, ensureAllPlayersQueued } from '../engine/battleFlow';
import {
  buildPendingActions,
  buildTargetPrompt,
  getAliveActors,
  getSkillLabel,
  getTargetCandidates,
  resolveAutoTargets,
  validateSkillSelection,
  type TargetPrompt,
} from '../engine/commandRules';
import { StatusManager } from '../engine/statusManager';
import type { BattleActor } from '../types/battleTypes';
import type { SkillId } from '../types/skillIds';
import type { QueuedAction } from '../types/queuedAction';

export function useBattleController() {
  const statusManager = React.useRef(new StatusManager());
  const [playerTeam, setPlayerTeam] = React.useState<BattleActor[]>(createInitialPlayerTeam());
  const [enemyTeam, setEnemyTeam] = React.useState<BattleActor[]>(generateRandomEnemyTeam());
  const [battleLog, setBattleLog] = React.useState<string[]>(['戦闘開始！']);
  const [actionQueue, setActionQueue] = React.useState<QueuedAction[]>([]);
  const [selectedActor, setSelectedActor] = React.useState<BattleActor | null>(null);
  const [targetPrompt, setTargetPrompt] = React.useState<TargetPrompt | null>(null);

  const pendingActions = React.useMemo(() => buildPendingActions(actionQueue), [actionQueue]);
  const targetCandidates = React.useMemo(
    () => getTargetCandidates(targetPrompt, playerTeam, enemyTeam),
    [targetPrompt, playerTeam, enemyTeam]
  );
  const alivePlayersCount = React.useMemo(
    () => getAliveActors(playerTeam).length,
    [playerTeam]
  );

  const logMessage = (message: string) => {
    setBattleLog(prev => [...prev, message]);
  };

  const resetBattle = () => {
    setPlayerTeam(createInitialPlayerTeam());
    setEnemyTeam(generateRandomEnemyTeam());
    setBattleLog(['戦闘開始！']);
    setActionQueue([]);
    setSelectedActor(null);
    setTargetPrompt(null);
    statusManager.current.clear();
  };

  const enqueueAction = (actorId: string, skillId: SkillId, targetIds?: string[]) => {
    setActionQueue(prev => [...prev, { actorId, skillId, targetIds }]);
    setSelectedActor(null);
    setTargetPrompt(null);
  };

  const handleSkillSelect = (skillId: SkillId) => {
    if (!selectedActor) return;

    const validationMessage = validateSkillSelection({
      actor: selectedActor,
      skillId,
      actionQueue,
    });
    if (validationMessage) {
      logMessage(validationMessage);
      return;
    }

    const autoTargets = resolveAutoTargets({
      actorId: selectedActor.actor.name,
      skillId,
      playerTeam,
      enemyTeam,
    });
    if (autoTargets) {
      enqueueAction(selectedActor.actor.name, skillId, autoTargets);
      return;
    }

    const prompt = buildTargetPrompt(selectedActor.actor.name, skillId);
    if (prompt) {
      setTargetPrompt(prompt);
      return;
    }

    enqueueAction(selectedActor.actor.name, skillId);
  };

  const handleTargetPick = (targetId: string) => {
    if (!targetPrompt) return;
    enqueueAction(targetPrompt.actorId, targetPrompt.skillId, [targetId]);
  };

  const handleCancelSelection = () => {
    setSelectedActor(null);
    setTargetPrompt(null);
  };

  const executeTurn = () => {
    const validationMessage = ensureAllPlayersQueued(playerTeam, actionQueue);
    if (validationMessage) {
      logMessage(validationMessage);
      return;
    }

    const outcome = executeBattleTurn({
      playerTeam,
      enemyTeam,
      actionQueue,
      statusManager: statusManager.current,
    });

    outcome.events.forEach(event => {
      const skillLabel = getSkillLabel(event.skill);
      const detail = event.detail ? `→${event.detail}` : '';
      logMessage(`${event.actorName}の${skillLabel}${detail}`);
    });

    setPlayerTeam(outcome.nextPlayerTeam);
    setEnemyTeam(outcome.nextEnemyTeam);
    setActionQueue([]);
    setSelectedActor(null);
    setTargetPrompt(null);

    if (outcome.enemiesDefeated) {
      logMessage('🎉 勝利！リセットして再戦できます');
    } else if (outcome.playersDefeated) {
      logMessage('😱 全滅...リセットして再挑戦してください');
    }
  };

  return {
    actionQueue,
    alivePlayersCount,
    battleLog,
    enemyTeam,
    pendingActions,
    playerTeam,
    selectedActor,
    targetCandidates,
    targetPrompt,
    resetBattle,
    executeTurn,
    handleCancelSelection,
    handleSkillSelect,
    handleTargetPick,
    setSelectedActor,
  };
}
