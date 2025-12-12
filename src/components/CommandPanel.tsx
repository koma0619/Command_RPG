import React from 'react';
import type { Actor } from '../types/battleTypes';
import { SKILLS } from '../data/skillData';

interface CommandPanelProps {
  actor: Actor | null;
  onSkillSelect: (skillId: string) => void;
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
        {actor.emoji} {actor.name}のターン
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
        {actor.skills.map((skillId) => {
          const skill = SKILLS[skillId];
          return (
            <button
              key={skillId}
              onClick={() => onSkillSelect(skillId)}
              className="command-button"
              disabled={disabled || actor.mp < skill.mpCost}
              title={`${skill.name} (消費MP: ${skill.mpCost})\n${skill.description}`}
            >
              {skill.name}
              {actor.mp < skill.mpCost && ' (MP不足)'}
            </button>
          );
        })}
      </div>
      <button
        className="execute-button"
        onClick={onActionComplete}
        disabled={disabled}
      >
        行動開始
      </button>
    </div>
  );
}