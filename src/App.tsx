import React from 'react';
import './App.css';
import './components/BattleComponents.css';
import './components/CommandPanel.css';
import { BattleLog, EnemyTeamDisplay, PlayerTeamDisplay } from './components/BattleComponents';
import { CommandPanel } from './components/CommandPanel';
import type { BattleActor } from './types/battleTypes';
import { determineTurnOrder } from './engine/turnOrder';
import { resolveActions } from './engine/actionResolver';
import { StatusManager } from './engine/statusManager';
import { generateRandomEnemyTeam, createInitialPlayerTeam } from './data/characterData';

interface BattleState {
  playerTeam: BattleActor[];
  enemyTeam: BattleActor[];
  battleLog: string[];
  currentTurn: number;
  actionQueue: Array<{actorId: string, action: string, targetId?: string}>;
  pendingActions: Map<string, string>;
  selectedActor: BattleActor | null;
  selectedAction: string | null;
  isTargetSelection: boolean;
  targetType: 'enemy' | 'ally' | null;
}

export default function App(): React.ReactElement {
  const [battleState, setBattleState] = React.useState<BattleState>({
    playerTeam: createInitialPlayerTeam(),
    enemyTeam: generateRandomEnemyTeam(),
    battleLog: ['戦闘開始！'],
    currentTurn: 1,
    actionQueue: [],
    pendingActions: new Map(),
    selectedActor: null,
    selectedAction: null,
    isTargetSelection: false,
    targetType: null,
  });

  const statusManager = React.useRef(new StatusManager());

  const addBattleLog = (message: string) => {
    setBattleState(prev => ({
      ...prev,
      battleLog: [...prev.battleLog, message]
    }));
  };

  const handleCancel = () => {
    setBattleState(prev => ({
      ...prev,
      selectedAction: null,
      isTargetSelection: false,
      targetType: null
    }));
  };

  const executeTurn = () => {
    if (battleState.actionQueue.length < battleState.playerTeam.length) {
      addBattleLog('全員のコマンドを入力してください');
      return;
    }

    // Action オブジェクトを作成
    const allActors = [...battleState.playerTeam, ...battleState.enemyTeam];
    const actions = battleState.actionQueue.map(qa => {
      const actor = allActors.find(a => a.actor.name === qa.actorId);
      if (!actor) return null;
      return {
        actor: actor.actor,
        skillName: qa.action === 'defend' ? 'defend' : (qa.action || 'attack')
      };
    }).filter((a): a is any => a !== null);

    // 行動順を決定
    const turnOrder = determineTurnOrder(actions);

    // 行動を実行
    const results = resolveActions(
      turnOrder,
      allActors.map(ba => ba.actor),
      statusManager.current
    );

    // イベントをログに追加
    results.events.forEach(event => {
      addBattleLog(`${event.actorName}の${event.skill}→${event.detail || ''}`);
    });

    // ターン終了処理
    statusManager.current.tickTurn();
    setBattleState(prev => ({
      ...prev,
      currentTurn: prev.currentTurn + 1,
      actionQueue: [],
      pendingActions: new Map(),
      playerTeam: prev.playerTeam.map(ba => ({
        ...ba,
        hp: results.actors.find(a => a.name === ba.actor.name)?.hp ?? ba.currentHp
      })),
      enemyTeam: prev.enemyTeam.map(ba => ({
        ...ba,
        hp: results.actors.find(a => a.name === ba.actor.name)?.hp ?? ba.currentHp
      }))
    }));

    // 戦闘終了判定
    if (battleState.enemyTeam.every(e => e.currentHp <= 0)) {
      addBattleLog('🎉 勝利！');
      // TODO: 勝利報酬処理
    } else if (battleState.playerTeam.every(p => p.currentHp <= 0)) {
      addBattleLog('😱 全滅...');
      // TODO: ゲームオーバー処理
    }
  };

  const handleActorSelect = (actor: BattleActor) => {
    if (battleState.actionQueue.find(a => a.actorId === actor.actor.name)) {
      addBattleLog(`${actor.actor.name}は既に行動を選択済みです`);
      return;
    }

    setBattleState(prev => ({
      ...prev,
      selectedActor: actor
    }));
  };

  return (
    <div className="game-container">
      <BattleLog messages={battleState.battleLog} />
      <EnemyTeamDisplay enemies={battleState.enemyTeam.map(ba => ba.actor)} />
      <PlayerTeamDisplay 
        players={battleState.playerTeam.map(ba => ba.actor)}
        pendingActions={battleState.pendingActions}
      />

      {battleState.selectedActor && (
        <CommandPanel
          actor={battleState.selectedActor.actor}
          onSkillSelect={() => {
            // スキル選択処理
          }}
          onActionComplete={() => {
            handleCancel();
          }}
          disabled={false}
        />
      )}

      {!battleState.selectedActor && !battleState.isTargetSelection && 
       battleState.playerTeam.map(battleActor => (
         <button
           key={battleActor.actor.name}
           onClick={() => handleActorSelect(battleActor)}
           disabled={battleState.actionQueue.some(a => a.actorId === battleActor.actor.name)}
           className="actor-select-button"
         >
           {battleActor.actor.emoji} {battleActor.actor.name}のコマンドを選択
         </button>
       ))}

      {battleState.actionQueue.length === battleState.playerTeam.length && (
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