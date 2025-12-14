import React from 'react';
import type { BattleActor } from '../types/battleTypes';

interface BattleLogProps {
  messages: string[];
}

export function BattleLog({ messages }: BattleLogProps): React.ReactElement {
  const logRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div ref={logRef} className="battle-log">
      {messages.map((msg, i) => (
        <p key={i}>{msg}</p>
      ))}
    </div>
  );
}

interface EnemyTeamDisplayProps {
  enemies: BattleActor[];
}

export function EnemyTeamDisplay({ enemies }: EnemyTeamDisplayProps): React.ReactElement {
  return (
    <div className="enemy-list">
      {enemies.map((e) => (
        <div key={e.actor.name} className="enemy-item">
          <div className="enemy-header">{e.actor.emoji} {e.actor.name}</div>
          <div>HP: {e.currentHp} / {e.actor.hp} MP: {e.currentMp} / {e.actor.mp}</div>
          <div>ATK: {e.actor.atk} DEF: {e.actor.def} SPD: {e.actor.spd}</div>
        </div>
      ))}
    </div>
  );
}

interface PlayerTeamDisplayProps {
  players: BattleActor[];
  pendingActions: Map<string, string>;
}

export function PlayerTeamDisplay({ players, pendingActions }: PlayerTeamDisplayProps): React.ReactElement {
  return (
    <div className="player-list">
      {players.map((p) => (
        <div key={p.actor.name} className="player-item">
          <div className="player-header">{p.actor.emoji} {p.actor.name}</div>
          <div>HP: {p.currentHp} / {p.actor.hp} MP: {p.currentMp} / {p.actor.mp}</div>
          <div>
            {pendingActions.has(p.actor.name) ? (
              <span className="pending-action">⏳ {pendingActions.get(p.actor.name)}</span>
            ) : (
              <span className="waiting">🤔 コマンド待ち</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
