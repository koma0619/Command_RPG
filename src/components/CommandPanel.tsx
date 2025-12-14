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
    return <div className="command-panel"></div>;
  }

  return (
    <div className="command-panel">
      <div className="command-header">
        {actor.actor.emoji} {actor.actor.name}のターン
      </div>
      <div className="command-grid">
        <button
          onClick={() => onSkillSelect('attack')}
          className="command-button"
          disabled={disabled}
        >
          ⚔️ 攻撃
        </button>
        <button
          onClick={() => onSkillSelect('defend')}
          className="command-button"
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
              className="command-button"
              disabled={disabled || !hasMp}
              title={`${skill.name} (消費MP: ${skill.mpCost})\n${skill.description}`}
            >
              {skill.name}
              {!hasMp && ' (MP不足)'}
            </button>
          );
        })}
      </div>
      <button
        className="execute-button"
        onClick={onActionComplete}
        disabled={disabled}
      >
        キャンセル
      </button>
    </div>
  );
}
