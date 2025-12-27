import React from 'react';
import type { BattleActor } from '../types/battleTypes';
import type { SkillId } from '../types/skillIds';
import { SKILLS } from '../data/skillData';

interface CommandPanelProps {
  actor: BattleActor | null;
  onSkillSelect: (skillId: SkillId) => void;
  onActionComplete: () => void;
  disabled: boolean;
}

export function CommandPanel({
  actor,
  onSkillSelect,
  onActionComplete,
  disabled,
}: CommandPanelProps): React.ReactElement {
  if (!actor) {
    return <div className="rounded-2xl border border-white/10 bg-black/40 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.45)]"></div>;
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.45)] backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-bold tracking-wide text-white/80">
          {actor.actor.emoji} {actor.actor.name}のターン
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold text-white/60">
          MP {actor.currentMp} / {actor.actor.stats.mp}
        </div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <button
          onClick={() => onSkillSelect('attack')}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white transition hover:border-amber-400 hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={disabled}
        >
          ⚔️ 攻撃
        </button>
        <button
          onClick={() => onSkillSelect('defend')}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white transition hover:border-sky-400 hover:bg-sky-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={disabled}
        >
          🛡️ 防御
        </button>
        {actor.actor.skills.map((skillId) => {
          const skill = SKILLS[skillId];
          if (!skill) return null;
          const hasMp = actor.currentMp >= skill.mpCost;
          return (
            <button
              key={skillId}
              onClick={() => onSkillSelect(skillId)}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white transition hover:border-rose-400 hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={disabled || !hasMp}
              title={`${skill.name} (消費MP: ${skill.mpCost})\n${skill.description}`}
            >
              {skill.name}
              {!hasMp && <span className="text-white/60"> (MP不足)</span>}
            </button>
          );
        })}
      </div>
      <button
        className="mt-4 w-full rounded-full border border-white/10 bg-white/5 py-3 text-sm font-bold tracking-widest text-white/80 transition hover:border-white/30 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
        onClick={onActionComplete}
        disabled={disabled}
      >
        キャンセル
      </button>
    </div>
  );
}
