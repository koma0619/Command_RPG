import React, { useState, useEffect } from 'react';
import type { Actor, Skill } from '@/types/battleTypes';
// スキルデータをインポート
import { SKILLS } from '@/data/skillData';
// キャラクターデータをインポート
import { createInitialPlayerTeam, generateRandomEnemyTeam } from '@/data/characterData';

interface StatusEffect {
  value: number;
  duration: number;
}

interface BattleActor {
  actor: Actor;
  currentHp: number;
  currentMp: number;
  status: { [key: string]: StatusEffect };
}

interface Command {
  actor: BattleActor;
  skill: Skill;
  targets: BattleActor[];
}

function DQBattle() {
  const [gameState, setGameState] = useState<'start' | 'input' | 'execute' | 'result'>('start');
  const [playerTeam, setPlayerTeam] = useState<BattleActor[]>([]);
  const [enemyTeam, setEnemyTeam] = useState<BattleActor[]>([]);
  const [commands, setCommands] = useState<Command[]>([]);
  const [currentInputIndex, setCurrentInputIndex] = useState(0);
  const [selectedCommand, setSelectedCommand] = useState<'attack' | 'skill' | 'defend' | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [wins, setWins] = useState(0);

  // ゲーム初期化
  const initGame = () => {
    const players = createInitialPlayerTeam;
    
    const enemies = generateRandomEnemyTeam();
    
    setPlayerTeam(players);
    setEnemyTeam(enemies);
    setCommands([]);
    setCurrentInputIndex(0);
    setSelectedCommand(null);
    setSelectedSkill(null);
    setBattleLog(['戦闘開始！']);
    setGameState('input');
  };

  // ターゲット選択
  const selectTarget = (target: BattleActor) => {
    if (!selectedSkill) return;
    
    const currentActor = playerTeam[currentInputIndex];
    const targets = selectedSkill.target === 'enemy_all' || selectedSkill.target === 'ally_all' 
      ? (selectedSkill.target.startsWith('enemy') ? enemyTeam : playerTeam)
      : [target];
    
    const newCommands = [...commands, { actor: currentActor, skill: selectedSkill, targets }];
    setCommands(newCommands);
    setSelectedCommand(null);
    setSelectedSkill(null);
    
    if (currentInputIndex + 1 >= playerTeam.filter(p => p.currentHp > 0).length) {
      executeCommands(newCommands);
    } else {
      setCurrentInputIndex(currentInputIndex + 1);
    }
  };

  // コマンド実行
  const executeCommands = (playerCommands: Command[]) => {
    setGameState('execute');
    
    // 敵のコマンド生成
    const enemyCommands: Command[] = enemyTeam
      .filter(e => e.currentHp > 0)
      .map(enemy => {
        const skillIds = ['attack', ...enemy.actor.skills];
        const skillId = skillIds[Math.floor(Math.random() * skillIds.length)];
        const skill = SKILLS[skillId];
        
        let targets: BattleActor[];
        if (skill.target === 'enemy_single') {
          const alive = playerTeam.filter(p => p.currentHp > 0);
          targets = [alive[Math.floor(Math.random() * alive.length)]];
        } else if (skill.target === 'enemy_all') {
          targets = playerTeam;
        } else if (skill.target === 'ally_single') {
          const alive = enemyTeam.filter(e => e.currentHp > 0);
          targets = [alive[Math.floor(Math.random() * alive.length)]];
        } else if (skill.target === 'ally_all') {
          targets = enemyTeam;
        } else {
          targets = [enemy];
        }
        
        return { actor: enemy, skill, targets };
      });
    
    // 全コマンドを素早さ順にソート
    const allCommands = [...playerCommands, ...enemyCommands].sort((a, b) => {
      const priorityA = a.skill.priority || 0;
      const priorityB = b.skill.priority || 0;
      if (priorityA !== priorityB) return priorityB - priorityA;
      
      const spdA = a.actor.actor.spd * (a.actor.status.spd?.value || 1);
      const spdB = b.actor.actor.spd * (b.actor.status.spd?.value || 1);
      return spdB - spdA;
    });
    
    // コマンド実行
    const logs: string[] = [];
    let updatedPlayers = [...playerTeam];
    let updatedEnemies = [...enemyTeam];
    
    allCommands.forEach(cmd => {
      if (cmd.actor.currentHp <= 0) return;
      
      const actorName = cmd.actor.actor.name;
      logs.push(`${actorName}の${cmd.skill.name}！`);
      
      // ダメージ計算
      if (cmd.skill.type.startsWith('attack')) {
        cmd.targets.forEach(target => {
          if (target.currentHp <= 0) return;
          
          let damage = 0;
          if (cmd.skill.type === 'attack_magic') {
            damage = cmd.skill.power || 0;
            if (target.status.magic_resist) {
              damage *= target.status.magic_resist.value;
            }
          } else {
            const atk = cmd.actor.actor.atk * (cmd.actor.status.atk?.value || 1);
            const def = target.actor.def * (target.status.def?.value || 1);
            damage = Math.max(1, Math.floor((atk - def / 2) * (cmd.skill.power || 1)));
          }
          
          damage = Math.floor(damage);
          target.currentHp = Math.max(0, target.currentHp - damage);
          logs.push(`${target.actor.name}に${damage}のダメージ！`);
          
          if (target.currentHp === 0) {
            logs.push(`${target.actor.name}は倒れた！`);
          }
        });
      }
      
      // 回復
      if (cmd.skill.type === 'heal') {
        cmd.targets.forEach(target => {
          if (target.currentHp > 0) {
            const heal = cmd.skill.power || 0;
            target.currentHp = Math.min(target.actor.hp, target.currentHp + heal);
            logs.push(`${target.actor.name}のHPが${heal}回復！`);
          }
        });
      }
      
      // バフ/デバフ
      if (cmd.skill.effect && (cmd.skill.type === 'buff' || cmd.skill.type === 'debuff')) {
        const success = !cmd.skill.chance || Math.random() < cmd.skill.chance;
        if (success) {
          cmd.targets.forEach(target => {
            target.status[cmd.skill.effect!.key] = {
              value: cmd.skill.effect!.value,
              duration: cmd.skill.effect!.duration
            };
          });
          logs.push(`${cmd.skill.name}が成功！`);
        } else {
          logs.push(`${cmd.skill.name}は失敗！`);
        }
      }
    });
    
    // ステータス効果の持続時間を減らす
    [...updatedPlayers, ...updatedEnemies].forEach(actor => {
      Object.keys(actor.status).forEach(key => {
        actor.status[key].duration--;
        if (actor.status[key].duration <= 0) {
          delete actor.status[key];
        }
      });
    });
    
    setPlayerTeam(updatedPlayers);
    setEnemyTeam(updatedEnemies);
    setBattleLog(logs);
    
    // 勝敗判定
    setTimeout(() => {
      const playerAlive = updatedPlayers.some(p => p.currentHp > 0);
      const enemyAlive = updatedEnemies.some(e => e.currentHp > 0);
      
      if (!enemyAlive) {
        setWins(wins + 1);
        if (wins + 1 >= 5) {
          setBattleLog([...logs, '5連勝達成！ゲームクリア！']);
          setGameState('result');
        } else {
          setBattleLog([...logs, '勝利！次の戦闘へ...']);
          setTimeout(() => initGame(), 2000);
        }
      } else if (!playerAlive) {
        setBattleLog([...logs, '全滅した...']);
        setGameState('result');
      } else {
        setCommands([]);
        setCurrentInputIndex(0);
        setGameState('input');
      }
    }, 2000);
  };

  if (gameState === 'start') {
    return (
      <div className="min-h-screen bg-black text-white p-8 font-mono">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl mb-8">⚔️ ドラクエ風バトル ⚔️</h1>
          <p className="mb-8 text-xl">3vs3のターン制バトル<br/>5連勝を目指せ！</p>
          <button
            onClick={initGame}
            className="bg-blue-600 hover:bg-blue-700 px-8 py-4 text-2xl rounded"
          >
            ゲーム開始
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'result') {
    return (
      <div className="min-h-screen bg-black text-white p-8 font-mono">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl mb-8">{wins >= 5 ? '🎉 ゲームクリア！' : '💀 ゲームオーバー'}</h1>
          <p className="mb-8 text-xl">連勝数: {wins}</p>
          <button
            onClick={() => {
              setWins(0);
              setGameState('start');
            }}
            className="bg-blue-600 hover:bg-blue-700 px-8 py-4 text-xl rounded"
          >
            タイトルへ
          </button>
        </div>
      </div>
    );
  }

  const currentActor = gameState === 'input' ? playerTeam[currentInputIndex] : null;
  const alivePlayerCount = playerTeam.filter(p => p.currentHp > 0).length;

  return (
    <div className="min-h-screen bg-black text-white p-4 font-mono">
      <div className="max-w-6xl mx-auto">
        <div className="mb-4 text-center text-xl">連勝数: {wins}/5</div>
        
        {/* 敵チーム */}
        <div className="mb-8">
          <div className="grid grid-cols-3 gap-4">
            {enemyTeam.map((enemy, i) => (
              <div
                key={i}
                className={`border-2 p-4 cursor-pointer ${
                  enemy.currentHp > 0 ? 'border-red-500 bg-red-900/20' : 'border-gray-700 bg-gray-900/20 opacity-50'
                } ${selectedSkill && selectedSkill.target.startsWith('enemy') && enemy.currentHp > 0 ? 'hover:bg-red-800/40' : ''}`}
                onClick={() => selectedSkill && selectedSkill.target.startsWith('enemy') && enemy.currentHp > 0 && selectTarget(enemy)}
              >
                <div className="text-3xl mb-2 text-center">{enemy.actor.emoji}</div>
                <div className="text-center mb-2">{enemy.actor.name}</div>
                <div className="text-sm">
                  <div>HP: {enemy.currentHp}/{enemy.actor.hp}</div>
                  <div className="w-full bg-gray-700 h-2 mt-1">
                    <div className="bg-green-500 h-2" style={{ width: `${(enemy.currentHp / enemy.actor.hp) * 100}%` }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* バトルログ */}
        <div className="mb-8 border-2 border-white p-4 h-32 overflow-y-auto bg-blue-900/20">
          {battleLog.map((log, i) => (
            <div key={i}>{log}</div>
          ))}
        </div>

        {/* プレイヤーチーム */}
        <div className="mb-8">
          <div className="grid grid-cols-3 gap-4">
            {playerTeam.map((player, i) => (
              <div
                key={i}
                className={`border-2 p-4 ${
                  player.currentHp > 0 ? 'border-blue-500 bg-blue-900/20' : 'border-gray-700 bg-gray-900/20 opacity-50'
                } ${gameState === 'input' && i === currentInputIndex ? 'ring-4 ring-yellow-400' : ''} ${
                  selectedSkill && selectedSkill.target.startsWith('ally') && player.currentHp > 0 ? 'cursor-pointer hover:bg-blue-800/40' : ''
                }`}
                onClick={() => selectedSkill && selectedSkill.target.startsWith('ally') && player.currentHp > 0 && selectTarget(player)}
              >
                <div className="text-3xl mb-2 text-center">{player.actor.emoji}</div>
                <div className="text-center mb-2">{player.actor.name}</div>
                <div className="text-sm">
                  <div>HP: {player.currentHp}/{player.actor.hp}</div>
                  <div className="w-full bg-gray-700 h-2 mt-1 mb-2">
                    <div className="bg-green-500 h-2" style={{ width: `${(player.currentHp / player.actor.hp) * 100}%` }}></div>
                  </div>
                  <div>MP: {player.currentMp}/{player.actor.mp}</div>
                  <div className="w-full bg-gray-700 h-2 mt-1">
                    <div className="bg-blue-500 h-2" style={{ width: `${(player.currentMp / player.actor.mp) * 100}%` }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* コマンド入力 */}
        {gameState === 'input' && currentActor && currentActor.currentHp > 0 && (
          <div className="border-2 border-yellow-400 p-4 bg-gray-900">
            <div className="text-xl mb-4">{currentActor.actor.name}のコマンド</div>
            
            {!selectedCommand && (
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => {
                    setSelectedSkill(SKILLS.attack);
                    setSelectedCommand('attack');
                  }}
                  className="bg-red-600 hover:bg-red-700 p-4 rounded"
                >
                  <div className="mx-auto mb-2" />
                  攻撃
                </button>
                <button
                  onClick={() => setSelectedCommand('skill')}
                  className="bg-purple-600 hover:bg-purple-700 p-4 rounded"
                >
                  <div className="mx-auto mb-2" />
                  スキル
                </button>
                <button
                  onClick={() => {
                    setSelectedSkill(SKILLS.defend);
                    selectTarget(currentActor);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 p-4 rounded"
                >
                  <div className="mx-auto mb-2" />
                  防御
                </button>
              </div>
            )}
            
            {selectedCommand === 'skill' && (
              <div>
                <button
                  onClick={() => setSelectedCommand(null)}
                  className="mb-4 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded"
                >
                  ← 戻る
                </button>
                <div className="grid grid-cols-2 gap-2">
                  {currentActor.actor.skills.map(skillId => {
                    const skill = SKILLS[skillId];
                    if (!skill) return null;
                    const canUse = currentActor.currentMp >= skill.mpCost;
                    return (
                      <button
                        key={skillId}
                        onClick={() => {
                          if (canUse) {
                            currentActor.currentMp -= skill.mpCost;
                            setSelectedSkill(skill);
                            if (skill.target === 'self' || skill.target === 'enemy_all' || skill.target === 'ally_all') {
                              selectTarget(skill.target === 'self' ? currentActor : (skill.target.startsWith('enemy') ? enemyTeam[0] : playerTeam[0]));
                            }
                          }
                        }}
                        disabled={!canUse}
                        className={`p-3 rounded text-left ${
                          canUse ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-700 opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <div className="font-bold">{skill.name}</div>
                        <div className="text-xs">MP:{skill.mpCost}</div>
                        <div className="text-xs text-gray-300">{skill.description}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            
            {selectedSkill && (selectedSkill.target === 'enemy_single' || selectedSkill.target === 'ally_single') && (
              <div className="text-center text-xl">
                {selectedSkill.target === 'enemy_single' ? '敵を選択してください' : '味方を選択してください'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default DQBattle;