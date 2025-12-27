import React from 'react';
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

  const isAwaitingInput = actionQueue.length === 0;
  const turnInfo = actionQueue.length > 0 ? `${actionQueue.length}件入力中` : '入力待ち';

  return (
    <div className="relative min-h-screen bg-slate-950 text-white font-['Oswald'] overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_15%,rgba(255,183,77,0.18),transparent_40%),radial-gradient(circle_at_85%_10%,rgba(74,222,255,0.12),transparent_35%),linear-gradient(160deg,#0b0d10,#111621,#0a0c12)]" />
        <div className="absolute inset-0 opacity-30 mix-blend-screen bg-[radial-gradient(circle,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[length:16px_16px]" />
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-orange-400/10 blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-sky-400/10 blur-3xl animate-pulse" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-4 px-4 pb-6 pt-6">
        <header className="relative text-center">
          <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-[11px] tracking-[0.2em] uppercase text-white/60">
            Command RPG
          </div>
          <h1 className="mt-3 text-5xl font-black tracking-tight text-transparent sm:text-6xl bg-gradient-to-r from-amber-300 via-orange-400 to-rose-500 bg-clip-text drop-shadow-[0_6px_18px_rgba(0,0,0,0.5)]">
            SLASH & BURST
          </h1>
          <div className="mt-2 text-sm text-white/60 tracking-wide">
            Turn-Based Clash • Focus, Select, Execute
          </div>
          <div className="mt-4 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              onClick={resetBattle}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-orange-400/40 bg-orange-500/20 px-5 py-2 text-xs font-bold uppercase tracking-[0.2em] text-orange-200 transition hover:bg-orange-500/30"
            >
              リセット
            </button>
            <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold tracking-wide border ${isAwaitingInput ? 'border-sky-400/40 bg-sky-500/20 text-sky-200' : 'border-amber-400/40 bg-amber-500/20 text-amber-200'}`}>
              ターン {turnInfo}
            </div>
          </div>
        </header>

        <section className="grid flex-1 grid-rows-[auto_auto_auto] gap-5">
          <div className="relative rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)] backdrop-blur-sm transition-colors duration-300 hover:bg-white/10 sm:p-5">
            <div className="absolute -top-3 left-5 rounded-full border border-red-900 bg-red-950/80 px-3 py-0.5 text-[10px] font-bold tracking-widest text-red-300">
              ENEMIES
            </div>
            <EnemyTeamDisplay enemies={enemyTeam} />
          </div>

          <div className="flex h-6 items-center justify-center">
            <span className="text-4xl font-black italic tracking-[0.2em] text-white/20">VS</span>
          </div>

          <div className="relative rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)] backdrop-blur-sm transition-colors duration-300 hover:bg-white/10 sm:p-5">
            <div className="absolute -top-3 left-5 rounded-full border border-sky-900 bg-sky-950/80 px-3 py-0.5 text-[10px] font-bold tracking-widest text-sky-300">
              HEROES
            </div>
            <PlayerTeamDisplay players={playerTeam} pendingActions={pendingActions} />
          </div>
        </section>

        <section className="grid items-center gap-3 sm:grid-cols-[1fr_auto]">
          <div className="text-center sm:text-left">
            {targetPrompt ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/20 px-4 py-1.5 text-xs font-bold tracking-wide text-red-200">
                対象を選択: {getSkillLabel(targetPrompt.skillId)}
              </span>
            ) : selectedActor ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/20 px-4 py-1.5 text-xs font-bold tracking-wide text-amber-200">
                コマンドを選択してください
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/20 px-4 py-1.5 text-xs font-bold tracking-wide text-sky-200">
                行動するキャラを選択してください
              </span>
            )}
          </div>
          <BattleLog messages={battleLog} />
        </section>

        {targetPrompt && (
          <section className="rounded-2xl border border-white/10 bg-black/40 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.45)] backdrop-blur-sm">
            <div className="text-sm font-bold tracking-wide text-white/70">
              対象を選んでください（{getSkillLabel(targetPrompt.skillId)}）
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {targetCandidates.map((t) => (
                <button
                  key={t.actor.name}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white transition hover:border-red-400 hover:bg-red-500/20"
                  onClick={() => handleTargetPick(t.actor.name)}
                >
                  {t.actor.emoji} {t.actor.name}
                </button>
              ))}
              {targetCandidates.length === 0 && (
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/60">
                  対象がいません
                </div>
              )}
            </div>
          </section>
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
          <section className="grid gap-2 sm:grid-cols-2">
            {playerTeam.map((battleActor) => (
              <button
                key={battleActor.actor.name}
                onClick={() => setSelectedActor(battleActor)}
                disabled={
                  battleActor.currentHp <= 0 ||
                  actionQueue.some((a) => a.actorId === battleActor.actor.name)
                }
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white transition hover:border-sky-400 hover:bg-sky-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {battleActor.actor.emoji} {battleActor.actor.name}のコマンドを選択
              </button>
            ))}
          </section>
        )}

        {actionQueue.length === alivePlayersCount && alivePlayersCount > 0 && (
          <button
            onClick={executeTurn}
            className="mt-2 w-full rounded-full border border-emerald-400/40 bg-emerald-500/20 py-4 text-base font-black tracking-widest text-emerald-200 transition hover:bg-emerald-500/30"
          >
            ターンを実行
          </button>
        )}
      </div>
    </div>
  );
}
