import React from 'react';
import type { Actor } from '../types/battleTypes';

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
  enemies: Actor[];
}

export function EnemyTeamDisplay({ enemies }: EnemyTeamDisplayProps): React.ReactElement {
  return (
    <div className="enemy-list">
      {enemies.map((e) => (
        <div key={e.name} className="enemy-item">
          <div className="enemy-header">{e.emoji} {e.name}</div>
          <div>HP: {e.hp} MP: {e.mp}</div>
          <div>ATK: {e.atk} DEF: {e.def} SPD: {e.spd}</div>
        </div>
      ))}
    </div>
  );
}

interface PlayerTeamDisplayProps {
  players: Actor[];
  pendingActions: Map<string, string>;
}

export function PlayerTeamDisplay({ players, pendingActions }: PlayerTeamDisplayProps): React.ReactElement {
  return (
    <div className="player-list">
      {players.map((p) => (
        <div key={p.name} className="player-item">
          <div className="player-header">{p.emoji} {p.name}</div>
          <div>HP: {p.hp} MP: {p.mp}</div>
          <div>
            {pendingActions.has(p.name) ? (
              <span className="pending-action">⏳ {pendingActions.get(p.name)}</span>
            ) : (
              <span className="waiting">🤔 コマンド待ち</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}