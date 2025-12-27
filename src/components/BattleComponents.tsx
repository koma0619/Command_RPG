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
    <div
      ref={logRef}
      className="h-[120px] w-full overflow-y-auto rounded-xl border border-white/10 bg-black/50 p-3 font-mono text-xs text-white/70 shadow-inner"
    >
      {messages.map((msg, i) => (
        <p
          key={i}
          className={`py-1 border-b border-white/5 last:border-b-0 ${i === messages.length - 1 ? 'text-white font-bold' : 'text-white/60'}`}
        >
          {msg}
        </p>
      ))}
    </div>
  );
}

interface EnemyTeamDisplayProps {
  enemies: BattleActor[];
}

function HpBar({ current, max }: { current: number; max: number }): React.ReactElement {
  const percent = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;
  return (
    <div>
      <div className="h-2.5 w-full overflow-hidden rounded-full border border-white/10 bg-black/40">
        <div
          className="h-full bg-gradient-to-r from-emerald-400 to-green-600 transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="mt-1 text-[11px] text-white/60">HP {current} / {max}</div>
    </div>
  );
}

export function EnemyTeamDisplay({ enemies }: EnemyTeamDisplayProps): React.ReactElement {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {enemies.map((e) => {
        const isDown = e.currentHp <= 0;
        return (
          <div
            key={e.actor.name}
            className={`rounded-xl border border-white/10 bg-slate-900/60 p-3 shadow-[0_10px_30px_rgba(0,0,0,0.35)] transition ${isDown ? 'opacity-50 grayscale' : 'hover:border-red-400/60'}`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="truncate text-sm font-bold text-white">{e.actor.emoji} {e.actor.name}</div>
              <span className="rounded-full border border-red-500/30 bg-red-500/20 px-2 py-0.5 text-[10px] font-bold tracking-widest text-red-200">
                FOE
              </span>
            </div>
            <div className="mt-2">
              <HpBar current={e.currentHp} max={e.actor.stats.hp} />
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-white/70">
              <div>MP {e.currentMp} / {e.actor.stats.mp}</div>
              <div>ATK {e.actor.stats.atk}</div>
              <div>DEF {e.actor.stats.def}</div>
              <div>SPD {e.actor.stats.spd}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface PlayerTeamDisplayProps {
  players: BattleActor[];
  pendingActions: Map<string, string>;
}

export function PlayerTeamDisplay({ players, pendingActions }: PlayerTeamDisplayProps): React.ReactElement {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {players.map((p) => {
        const isDown = p.currentHp <= 0;
        const pendingLabel = pendingActions.get(p.actor.name);
        return (
          <div
            key={p.actor.name}
            className={`rounded-xl border border-white/10 bg-slate-900/60 p-3 shadow-[0_10px_30px_rgba(0,0,0,0.35)] transition ${isDown ? 'opacity-50 grayscale' : 'hover:border-sky-400/60'}`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="truncate text-sm font-bold text-white">{p.actor.emoji} {p.actor.name}</div>
              <span className="rounded-full border border-sky-500/30 bg-sky-500/20 px-2 py-0.5 text-[10px] font-bold tracking-widest text-sky-200">
                ALLY
              </span>
            </div>
            <div className="mt-2">
              <HpBar current={p.currentHp} max={p.actor.stats.hp} />
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-white/70">
              <div>MP {p.currentMp} / {p.actor.stats.mp}</div>
              <div>ATK {p.actor.stats.atk}</div>
              <div>DEF {p.actor.stats.def}</div>
              <div>SPD {p.actor.stats.spd}</div>
            </div>
            <div className="mt-3 text-[11px] font-bold">
              {pendingLabel ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-500/20 px-2 py-1 text-amber-200">
                  ⏳ {pendingLabel}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-white/60">
                  🤔 コマンド待ち
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
