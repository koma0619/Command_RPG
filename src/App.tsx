import React from 'react';
import './App.css';
import './components/BattleComponents.css';
import './components/CommandPanel.css';
import { BattleLog, EnemyTeamDisplay, PlayerTeamDisplay } from './components/BattleComponents';
import { CommandPanel } from './components/CommandPanel';
import { getSkillLabel } from './engine/commandRules';
import { useBattleController } from './hooks/useBattleController';

export default function App(): React.ReactElement {
  const {
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
  } = useBattleController();

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
          <div>対象を選んでください（{getSkillLabel(targetPrompt.skillId)}）</div>
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
