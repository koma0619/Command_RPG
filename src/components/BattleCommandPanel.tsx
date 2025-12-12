import React from 'react';
import type { Actor } from '../types/battleTypes';
import { SKILLS } from '../data/skillData';

interface Props {
  player: Actor;
  onSelectCommand: (actorName: string, skillName: string) => void;
}

export default function BattleCommandPanel({ player, onSelectCommand }: Props): React.ReactElement {
  const [selectedSkill, setSelectedSkill] = React.useState<string | null>(null);

  const skillList = React.useMemo(() => {
    if (!player.name || !(player.name in SKILLS)) return ['防御'];
    return [player.name, '防御']; // プレイヤー固有スキルと防御
  }, [player.name]);

  return (
    <div className="battle-command-panel">
      <div className="actor-status">
        <div className="actor-header">
          <span>{player.emoji} {player.name}</span>
        </div>
        <div className="actor-stats">
          <div>HP: {player.hp}</div>
          <div>MP: {player.mp}</div>
        </div>
      </div>

      <div className="command-section">
        {selectedSkill ? (
          <>
            <div className="skill-detail">
              <h4>{selectedSkill}</h4>
              <p>{SKILLS[selectedSkill]?.description ?? ''}</p>
              {SKILLS[selectedSkill]?.mpCost !== undefined && (
                <p>消費MP: {SKILLS[selectedSkill]?.mpCost}</p>
              )}
            </div>
            <div className="action-buttons">
              <button 
                onClick={() => {
                  onSelectCommand(player.name, selectedSkill);
                  setSelectedSkill(null);
                }}
              >
                決定
              </button>
              <button onClick={() => setSelectedSkill(null)}>
                戻る
              </button>
            </div>
          </>
        ) : (
          <div className="skill-list">
            {skillList.map(name => (
              <button
                key={name}
                onClick={() => setSelectedSkill(name)}
                disabled={SKILLS[name]?.mpCost !== undefined && player.mp < SKILLS[name]?.mpCost}
              >
                {name}
                {SKILLS[name]?.mpCost !== undefined && ` (${SKILLS[name].mpCost}MP)`}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}