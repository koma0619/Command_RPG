import React from 'react';
import './App.css';
import './components/BattleComponents.css';
import './components/CommandPanel.css';
import { BattleLog, EnemyTeamDisplay, PlayerTeamDisplay } from './components/BattleComponents';
import { CommandPanel } from './components/CommandPanel';
import type { BattleActor, SkillTargetType } from './types/battleTypes';
import type { SkillId } from './types/skillIds';
import type { QueuedAction } from './types/queuedAction';
import { StatusManager } from './engine/statusManager';
import { generateRandomEnemyTeam, createInitialPlayerTeam } from './data/characterData';
import { SKILLS } from './data/skillData';
import { executeBattleTurn, ensureAllPlayersQueued } from './engine/battleFlow';

export default function App(): React.ReactElement {
  const statusManager = React.useRef(new StatusManager());
  const [playerTeam, setPlayerTeam] = React.useState<BattleActor[]>(createInitialPlayerTeam());
  const [enemyTeam, setEnemyTeam] = React.useState<BattleActor[]>(generateRandomEnemyTeam());
  const [battleLog, setBattleLog] = React.useState<string[]>(['戦闘開始！']);
  const [actionQueue, setActionQueue] = React.useState<QueuedAction[]>([]);
  const [pendingActions, setPendingActions] = React.useState<Map<string, string>>(new Map());
  const [selectedActor, setSelectedActor] = React.useState<BattleActor | null>(null);
  const [targetPrompt, setTargetPrompt] = React.useState<{ actorId: string; skillId: SkillId; targetType: SkillTargetType } | null>(null);

  const logMessage = (message: string) => {
    setBattleLog(prev => [...prev, message]);
  };

  const resetBattle = () => {
    setPlayerTeam(createInitialPlayerTeam());
    setEnemyTeam(generateRandomEnemyTeam());
    setBattleLog(['戦闘開始！']);
    setActionQueue([]);
    setPendingActions(new Map());
    setSelectedActor(null);
    setTargetPrompt(null);
    statusManager.current.clear();
  };

  const enqueueAction = (actorId: string, skillId: SkillId, targetIds?: string[]) => {
    setActionQueue(prev => [...prev, { actorId, skillId, targetIds }]);
    setPendingActions(prev => {
      const next = new Map(prev);
      next.set(actorId, SKILLS[skillId]?.name ?? skillId);
      return next;
    });
    setSelectedActor(null);
    setTargetPrompt(null);
  };

  const handleSkillSelect = (skillId: SkillId) => {
    if (!selectedActor) return;
    if (actionQueue.some(a => a.actorId === selectedActor.actor.name)) {
      logMessage(`${selectedActor.actor.name}は既に行動を選択済みです`);
      return;
    }

    const skill = SKILLS[skillId];
    const cost = skill.mpCost ?? 0;
    if (selectedActor.currentMp < cost) {
      logMessage(`${selectedActor.actor.name}はMPが足りない`);
      return;
    }

    const addAllTargets = (targetType: SkillTargetType) => {
      if (targetType === 'ally_all') {
        const ids = playerTeam.filter(p => p.currentHp > 0).map(p => p.actor.name);
        enqueueAction(selectedActor.actor.name, skillId, ids);
        return true;
      }
      if (targetType === 'enemy_all') {
        const ids = enemyTeam.filter(e => e.currentHp > 0).map(e => e.actor.name);
        enqueueAction(selectedActor.actor.name, skillId, ids);
        return true;
      }
      if (targetType === 'self') {
        enqueueAction(selectedActor.actor.name, skillId, [selectedActor.actor.name]);
        return true;
      }
      return false;
    };

    // auto-handle all/self targets
    if (addAllTargets(skill.target)) {
      return;
    }

    if (skill.target === 'ally_single' || skill.target === 'enemy_single') {
      setTargetPrompt({ actorId: selectedActor.actor.name, skillId, targetType: skill.target });
      return;
    }

    // fallback
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
      const skillLabel = SKILLS[event.skill]?.name ?? event.skill;
      const detail = event.detail ? `→${event.detail}` : '';
      logMessage(`${event.actorName}の${skillLabel}${detail}`);
    });

    setPlayerTeam(outcome.nextPlayerTeam);
    setEnemyTeam(outcome.nextEnemyTeam);
    setActionQueue([]);
    setPendingActions(new Map());
    setSelectedActor(null);
    setTargetPrompt(null);

    if (outcome.enemiesDefeated) {
      logMessage('🎉 勝利！リセットして再戦できます');
    } else if (outcome.playersDefeated) {
      logMessage('😱 全滅...リセットして再挑戦してください');
    }
  };

  const alivePlayersCount = playerTeam.filter(p => p.currentHp > 0).length;
  const targetCandidates = React.useMemo(() => {
    if (!targetPrompt) return [] as BattleActor[];
    if (targetPrompt.targetType.startsWith('enemy')) {
      return enemyTeam.filter(e => e.currentHp > 0);
    }
    return playerTeam.filter(p => p.currentHp > 0);
  }, [targetPrompt, playerTeam, enemyTeam]);

  return (
    <div className="game-container">
      <div className="top-bar">
        <button onClick={resetBattle} className="execute-button">リセット</button>
        <div className="turn-info">ターン {actionQueue.length > 0 ? `${actionQueue.length}件入力中` : '入力待ち'}</div>
      </div>

      <BattleLog messages={battleLog} />

      <EnemyTeamDisplay enemies={enemyTeam} />
      <PlayerTeamDisplay players={playerTeam} pendingActions={pendingActions} />

      {targetPrompt && (
        <div className="target-panel">
          <div>対象を選んでください（{SKILLS[targetPrompt.skillId]?.name ?? targetPrompt.skillId}）</div>
          <div className="target-buttons">
            {targetCandidates.map(t => (
              <button
                key={t.actor.name}
                className="command-button"
                onClick={() => handleTargetPick(t.actor.name)}
              >
                {t.actor.emoji} {t.actor.name}
              </button>
            ))}
            {targetCandidates.length === 0 && <div>対象がいません</div>}
          </div>
        </div>
      )}

      {selectedActor && (
        <CommandPanel
          actor={selectedActor}
          onSkillSelect={handleSkillSelect}
          onActionComplete={handleCancelSelection}
          disabled={false}
        />
      )}

      {!selectedActor && !targetPrompt && (
        <div className="actor-select-list">
          {playerTeam.map(battleActor => (
            <button
              key={battleActor.actor.name}
              onClick={() => setSelectedActor(battleActor)}
              disabled={
                battleActor.currentHp <= 0 ||
                actionQueue.some(a => a.actorId === battleActor.actor.name)
              }
              className="actor-select-button"
            >
              {battleActor.actor.emoji} {battleActor.actor.name}のコマンドを選択
            </button>
          ))}
        </div>
      )}

      {actionQueue.length === alivePlayersCount && alivePlayersCount > 0 && (
        <button
          onClick={executeTurn}
          className="execute-button"
        >
          ターンを実行
        </button>
      )}
    </div>
  );
}
