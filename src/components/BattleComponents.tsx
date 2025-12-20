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

function HpBar({ current, max }: { current: number; max: number }): React.ReactElement {
  return (
    <div className="hp-meter">
      <meter value={current} min={0} max={max} low={max * 0.25} high={max * 0.5} optimum={max}>
        {current} / {max}
      </meter>
      <span className="hp-meter-text">HP {current} / {max}</span>
    </div>
  );
}

export function EnemyTeamDisplay({ enemies }: EnemyTeamDisplayProps): React.ReactElement {
  return (
    <div className="enemy-list">
      {enemies.map((e) => (
        <div key={e.actor.name} className="enemy-item">
          <div className="enemy-header">{e.actor.emoji} {e.actor.name}</div>
          <HpBar current={e.currentHp} max={e.actor.hp} />
          <div>MP: {e.currentMp} / {e.actor.mp}</div>
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
          <HpBar current={p.currentHp} max={p.actor.hp} />
          <div>MP: {p.currentMp} / {p.actor.mp}</div>
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
