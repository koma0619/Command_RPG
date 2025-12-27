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
import type { ResolveEvent } from '../engine/actionResolver';
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
  const [isResolving, setIsResolving] = React.useState(false);
  const [attackingActorId, setAttackingActorId] = React.useState<string | null>(null);
  const [damagedActorIds, setDamagedActorIds] = React.useState<string[]>([]);
  const [damagePopups, setDamagePopups] = React.useState<
    { id: string; targetId: string; value: string; kind: 'damage' | 'heal' | 'miss' | 'revive' }[]
  >([]);

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

  const formatTargetLabel = (targetIds: string[]) => {
    if (targetIds.length === 0) return '対象';
    if (targetIds.length === 1) return targetIds[0];
    return targetIds.join('、');
  };

  const buildEventMessage = (event: ResolveEvent) => {
    const skillLabel = getSkillLabel(event.skill);
    const targetLabel = formatTargetLabel(event.targetIds);
    const valueLabel = event.value !== undefined ? `(${event.value})` : '';

    if (event.kind === 'damage') {
      return `${event.actorName}が${targetLabel}に${skillLabel}をした！${valueLabel}`;
    }
    if (event.kind === 'heal') {
      return `${event.actorName}が${targetLabel}を${skillLabel}で回復${valueLabel}`;
    }
    if (event.kind === 'miss') {
      return `${event.actorName}の${skillLabel}は外れた！`;
    }

    const detail = event.detail ? `→${event.detail}` : '';
    return `${event.actorName}の${skillLabel}${detail}`;
  };

  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const applyEventToTeams = (event: ResolveEvent) => {
    if (!['damage', 'heal', 'revive'].includes(event.kind)) return;
    const amount = event.value ?? 0;
    const targetIds = new Set(event.targetIds);

    const updateTeam = (team: BattleActor[]) =>
      team.map(actor => {
        if (!targetIds.has(actor.actor.name)) return actor;
        const maxHp = actor.actor.stats.hp;
        let nextHp = actor.currentHp;
        if (event.kind === 'damage') {
          nextHp = Math.max(0, actor.currentHp - amount);
        } else if (event.kind === 'heal') {
          nextHp = Math.min(maxHp, actor.currentHp + amount);
        } else if (event.kind === 'revive') {
          nextHp = Math.min(maxHp, amount);
        }
        return { ...actor, currentHp: nextHp };
      });

    setPlayerTeam(prev => updateTeam(prev));
    setEnemyTeam(prev => updateTeam(prev));
  };

  const resetBattle = () => {
    setPlayerTeam(createInitialPlayerTeam());
    setEnemyTeam(generateRandomEnemyTeam());
    setBattleLog(['戦闘開始！']);
    setActionQueue([]);
    setSelectedActor(null);
    setTargetPrompt(null);
    setIsResolving(false);
    setAttackingActorId(null);
    setDamagedActorIds([]);
    setDamagePopups([]);
    statusManager.current.clear();
  };

  const enqueueAction = (actorId: string, skillId: SkillId, targetIds?: string[]) => {
    setActionQueue(prev => [...prev, { actorId, skillId, targetIds }]);
    setSelectedActor(null);
    setTargetPrompt(null);
  };

  const handleSkillSelect = (skillId: SkillId) => {
    if (isResolving) return;
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
    if (isResolving) return;
    if (!targetPrompt) return;
    enqueueAction(targetPrompt.actorId, targetPrompt.skillId, [targetId]);
  };

  const handleCancelSelection = () => {
    setSelectedActor(null);
    setTargetPrompt(null);
  };

  const executeTurn = async () => {
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

    setIsResolving(true);
    setSelectedActor(null);
    setTargetPrompt(null);

    for (const event of outcome.events) {
      setAttackingActorId(event.actorId);
      await wait(200);
      setAttackingActorId(null);

      if (['damage', 'heal', 'revive', 'miss'].includes(event.kind)) {
        setDamagedActorIds(event.targetIds);
        const popupIds = event.targetIds.map(targetId => ({
          id: `${Date.now()}-${Math.random()}`,
          targetId,
          value:
            event.kind === 'miss'
              ? 'MISS'
              : `${event.kind === 'heal' || event.kind === 'revive' ? '+' : ''}${event.value ?? 0}`,
          kind: event.kind,
        }));
        if (popupIds.length > 0) {
          setDamagePopups(prev => [...prev, ...popupIds]);
          setTimeout(() => {
            setDamagePopups(prev => prev.filter(p => !popupIds.some(pop => pop.id === p.id)));
          }, 900);
        }
        await wait(120);
        setDamagedActorIds([]);
      }

      if (['damage', 'heal', 'revive'].includes(event.kind)) {
        applyEventToTeams(event);
      }

      logMessage(buildEventMessage(event));
      await wait(280);
    }

    setAttackingActorId(null);
    setDamagedActorIds([]);
    setPlayerTeam(outcome.nextPlayerTeam);
    setEnemyTeam(outcome.nextEnemyTeam);
    setActionQueue([]);
    setIsResolving(false);

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
    isResolving,
    attackingActorId,
    damagedActorIds,
    damagePopups,
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
