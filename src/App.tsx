import React, { useState, useEffect, useCallback, useRef } from 'react';

// ================== 設定・定数 ==================
const CONFIG = {
  BATTLE: {
    TURN_DELAY: 1500,
    RESTART_DELAY: 2000,
    MAX_LOG_LINES: 10,
    CRITICAL_RATE: 0.05,
    CRITICAL_MULTIPLIER: 1.5,
    MIN_DAMAGE: 1,
    ATTACK_VARIANCE: 0.2,
    DEFENSE_COEFFICIENT: 2,
    LOW_HP_THRESHOLD: 0.3,
    MEDIUM_HP_THRESHOLD: 0.5
  }
};

// アクション定数
const ACTION_TYPES = Object.freeze({
  ATTACK: 'attack',
  SPELL: 'spell',
  DEFEND: 'defend'
});

// 呪文定数
const SPELLS = Object.freeze({
  MERA: 'メラ',
  HOIMI: 'ホイミ',
  SUKARA: 'スカラ',
  RURA: 'ルーラ'
});

// ゲーム状態
const GAME_STATES = Object.freeze({
  INPUT: 'input',
  EXECUTING: 'executing',
  FINISHED: 'finished'
});

// ================== ユーティリティクラス ==================
class MathUtils {
  static randBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  static clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  static ratio(current: number, max: number): number {
    return max > 0 ? current / max : 0;
  }
}

class ColorUtils {
  static getHpColor(hpRatio) {
    if (hpRatio <= CONFIG.BATTLE.LOW_HP_THRESHOLD) return '#ff4444';
    if (hpRatio <= CONFIG.BATTLE.MEDIUM_HP_THRESHOLD) return '#ffff44';
    return '#44ff44';
  }

  static getBorderColor(character) {
    if (character.attack > character.baseAttack) return '#ff8844';
    if (character.defense > character.baseDefense) return '#4488ff';
    return '#ffffff';
  }
}

// ================== バトル計算エンジン ==================
class BattleCalculator {
  static calculateAttackDamage(attacker, defender) {
    const baseDamage = attacker.attack - Math.floor(defender.defense / CONFIG.BATTLE.DEFENSE_COEFFICIENT);
    const damage = this._applyVariance(baseDamage);
    const isCritical = this._rollCritical();
    
    return {
      damage: isCritical ? Math.floor(damage * CONFIG.BATTLE.CRITICAL_MULTIPLIER) : damage,
      isCritical
    };
  }

  static calculateSpellDamage(caster, target, basePower) {
    const magicAttack = Math.floor(caster.attack * 0.5);
    const totalPower = basePower + magicAttack;
    const damage = totalPower - Math.floor(target.defense * 0.25);
    
    return this._applyVariance(damage);
  }

  static calculateHealAmount(caster, baseHeal) {
    const magicPower = Math.floor(caster.attack * 0.3);
    const healAmount = baseHeal + magicPower;
    
    return Math.max(1, Math.floor(healAmount + (Math.random() * healAmount * 0.15 * 2 - healAmount * 0.15)));
  }

  static _applyVariance(baseDamage) {
    const variance = baseDamage * CONFIG.BATTLE.ATTACK_VARIANCE;
    const finalDamage = baseDamage + Math.random() * variance * 2 - variance;
    return Math.max(CONFIG.BATTLE.MIN_DAMAGE, Math.floor(finalDamage));
  }

  static _rollCritical() {
    return Math.random() < CONFIG.BATTLE.CRITICAL_RATE;
  }
}

// ================== 状態効果管理 ==================
class StatusEffect {
  constructor(stat: string, change: number, duration: number) {
    this.stat = stat;
    this.change = change;
    this.duration = duration;
  }

  decrementDuration() {
    this.duration--;
    return this.duration <= 0;
  }

  toString() {
    const sign = this.change > 0 ? '↑' : '↓';
    return `${this.stat}${sign}${this.duration}`;
  }
}

// ================== 呪文システム ==================
class Spell {
  constructor(name, mpCost, targetType, description, effect) {
    this.name = name;
    this.mpCost = mpCost;
    this.targetType = targetType;
    this.description = description;
    this.effect = effect;
  }

  cast(caster, target, addLogMessage) {
    this.effect(caster, target, addLogMessage);
  }

  canCast(caster) {
    return caster.mp >= this.mpCost && caster.alive;
  }
}

// 呪文データベース
const SpellDatabase = {
  [SPELLS.MERA]: new Spell(
    SPELLS.MERA, 3, 'enemy', '敵に炎のダメージを与える',
    (caster, target, addLogMessage) => {
      const damage = BattleCalculator.calculateSpellDamage(caster, target, 12);
      target.takeDamage(damage, false, addLogMessage);
    }
  ),
  [SPELLS.HOIMI]: new Spell(
    SPELLS.HOIMI, 4, 'ally', '味方のHPを回復する',
    (caster, target, addLogMessage) => {
      const healAmount = BattleCalculator.calculateHealAmount(caster, 15);
      target.heal(healAmount, addLogMessage);
    }
  ),
  [SPELLS.SUKARA]: new Spell(
    SPELLS.SUKARA, 2, 'ally', '味方の守備力を上げる',
    (caster, target, addLogMessage) => {
      target.addStatusEffect('defense', 5, 3, addLogMessage);
    }
  ),
  [SPELLS.RURA]: new Spell(
    SPELLS.RURA, 3, 'ally', '味方の攻撃力を上げる',
    (caster, target, addLogMessage) => {
      target.addStatusEffect('attack', 4, 3, addLogMessage);
    }
  )
};

// ================== キャラクタークラス ==================
class Character {
  constructor(config) {
    this.id = config.id || Math.random().toString(36).substr(2, 9);
    this.name = config.name;
    this.hp = config.hp;
    this.maxHp = config.hp;
    this.mp = config.mp;
    this.maxMp = config.mp;
    this.speed = config.speed;
    this.baseAttack = config.attack;
    this.attack = config.attack;
    this.baseDefense = config.defense;
    this.defense = config.defense;
    this.spells = config.spells || [];
    this.isPlayer = config.isPlayer;
    this.alive = true;
    this.statusEffects = new Map();
  }

  takeDamage(damage, isCritical = false, addLogMessage) {
    const actualDamage = Math.min(damage, this.hp);
    this.hp = Math.max(0, this.hp - damage);
    
    let message = `${this.name}に${actualDamage}のダメージ！`;
    if (isCritical) {
      message = `会心の一撃！${this.name}に${actualDamage}のダメージ！`;
    }
    addLogMessage(message);
    
    if (this.hp === 0 && this.alive) {
      this.alive = false;
      addLogMessage(`${this.name}は倒れた！`);
    }
  }

  heal(amount, addLogMessage) {
    const actualHeal = Math.min(amount, this.maxHp - this.hp);
    this.hp = Math.min(this.maxHp, this.hp + amount);
    
    if (actualHeal > 0) {
      addLogMessage(`${this.name}のHPが${actualHeal}回復した！`);
    }
  }

  consumeMP(amount) {
    this.mp = Math.max(0, this.mp - amount);
  }

  addStatusEffect(stat, change, duration, addLogMessage) {
    this.statusEffects.set(stat, new StatusEffect(stat, change, duration));
    this._applyStatChange(stat, change);
    
    const direction = change > 0 ? "上がった" : "下がった";
    addLogMessage(`${this.name}の${stat}が${Math.abs(change)}${direction}！`);
  }

  _applyStatChange(stat, change) {
    if (stat === 'attack') {
      this.attack = Math.max(1, this.attack + change);
    } else if (stat === 'defense') {
      this.defense = Math.max(1, this.defense + change);
    }
  }

  processEndTurn(addLogMessage) {
    for (const [stat, effect] of this.statusEffects.entries()) {
      if (effect.decrementDuration()) {
        this._removeEffect(stat);
        addLogMessage(`${this.name}の${stat}が元に戻った`);
      }
    }
  }

  _removeEffect(stat) {
    this.statusEffects.delete(stat);
    if (stat === 'attack') {
      this.attack = this.baseAttack;
    } else if (stat === 'defense') {
      this.defense = this.baseDefense;
    }
  }

  canCastSpell(spellName) {
    const spell = SpellDatabase[spellName];
    return spell && spell.canCast(this);
  }

  getStatusDisplay() {
    let status = `HP:${this.hp}/${this.maxHp} MP:${this.mp}/${this.maxMp}\nATK:${this.attack} DEF:${this.defense}`;
    
    const effects = Array.from(this.statusEffects.values()).map(effect => effect.toString());
    if (effects.length > 0) {
      status += `\n[${effects.join(' ')}]`;
    }
    
    return status;
  }

  getTargetDisplay() {
    return `${this.name} HP:${this.hp}/${this.maxHp} ATK:${this.attack} DEF:${this.defense}`;
  }
}

// ================== バトルアクション ==================
class BattleAction {
  constructor(actor, actionType, target = null, spellName = null) {
    this.actor = actor;
    this.actionType = actionType;
    this.target = target;
    this.spellName = spellName;
  }

  execute(addLogMessage) {
    if (!this.actor.alive) return;

    switch (this.actionType) {
      case ACTION_TYPES.ATTACK:
        this._executeAttack(addLogMessage);
        break;
      case ACTION_TYPES.SPELL:
        this._executeSpell(addLogMessage);
        break;
      case ACTION_TYPES.DEFEND:
        this._executeDefend(addLogMessage);
        break;
    }
  }

  _executeAttack(addLogMessage) {
    addLogMessage(`${this.actor.name}の攻撃！`);
    const result = BattleCalculator.calculateAttackDamage(this.actor, this.target);
    this.target.takeDamage(result.damage, result.isCritical, addLogMessage);
  }

  _executeSpell(addLogMessage) {
    const spell = SpellDatabase[this.spellName];
    if (!spell || !spell.canCast(this.actor)) {
      addLogMessage(`${this.actor.name}のMPが足りない！`);
      return;
    }
    
    this.actor.consumeMP(spell.mpCost);
    addLogMessage(`${this.actor.name}は${spell.name}を唱えた！`);
    spell.cast(this.actor, this.target, addLogMessage);
  }

  _executeDefend(addLogMessage) {
    addLogMessage(`${this.actor.name}は身を守っている`);
    this.actor.addStatusEffect('defense', 3, 1, addLogMessage);
  }
}

// ================== AI管理 ==================
class EnemyAI {
  planAction(enemy, players) {
    if (!enemy.alive) return null;

    const alivePlayers = players.filter(p => p.alive);
    if (alivePlayers.length === 0) return null;

    const actionPriorities = [];
    
    // 攻撃アクション
    alivePlayers.forEach(player => {
      const priority = this._calculateAttackPriority(enemy, player);
      actionPriorities.push({
        action: new BattleAction(enemy, ACTION_TYPES.ATTACK, player),
        priority
      });
    });

    // 防御アクション
    const defendPriority = this._calculateDefendPriority(enemy);
    actionPriorities.push({
      action: new BattleAction(enemy, ACTION_TYPES.DEFEND, enemy),
      priority: defendPriority
    });

    // 呪文アクション
    enemy.spells.forEach(spellName => {
      if (enemy.canCastSpell(spellName)) {
        const spell = SpellDatabase[spellName];
        const targets = spell.targetType === 'enemy' ? alivePlayers : [enemy];
        
        targets.forEach(target => {
          const priority = this._calculateSpellPriority(enemy, target, spell);
          actionPriorities.push({
            action: new BattleAction(enemy, ACTION_TYPES.SPELL, target, spellName),
            priority
          });
        });
      }
    });

    actionPriorities.sort((a, b) => b.priority - a.priority);
    return actionPriorities.length > 0 ? actionPriorities[0].action : null;
  }

  _calculateAttackPriority(attacker, target) {
    const hpFactor = 50 - (MathUtils.ratio(target.hp, target.maxHp) * 30);
    const defenseFactor = 30 - target.defense;
    const randomFactor = Math.random() * 10;
    return hpFactor + defenseFactor + randomFactor;
  }

  _calculateDefendPriority(character) {
    const hpRatio = MathUtils.ratio(character.hp, character.maxHp);
    const basePriority = hpRatio < CONFIG.BATTLE.LOW_HP_THRESHOLD ? 30 : 10;
    return basePriority + Math.random() * 10;
  }

  _calculateSpellPriority(caster, target, spell) {
    let priority = 20;
    
    if (spell.targetType === 'enemy') {
      priority += this._calculateAttackPriority(caster, target);
    } else if (spell.targetType === 'ally') {
      if (spell.name === SPELLS.HOIMI && MathUtils.ratio(target.hp, target.maxHp) < 0.5) {
        priority += 40;
      }
      if ((spell.name === SPELLS.SUKARA || spell.name === SPELLS.RURA) && 
          !target.statusEffects.has(spell.name === SPELLS.SUKARA ? 'defense' : 'attack')) {
        priority += 25;
      }
    }
    
    return priority + Math.random() * 10;
  }
}

// ================== キャラクターファクトリー ==================
const CharacterFactory = {
  createPlayerTeam() {
    return [
      new Character({
        id: 'player1',
        name: "勇者", hp: 45, mp: 15, speed: 4, attack: 18, defense: 12, 
        spells: [SPELLS.MERA, SPELLS.HOIMI, SPELLS.RURA], isPlayer: true
      }),
      new Character({
        id: 'player2',
        name: "僧侶", hp: 35, mp: 20, speed: 3, attack: 12, defense: 15, 
        spells: [SPELLS.HOIMI, SPELLS.SUKARA], isPlayer: true
      }),
      new Character({
        id: 'player3',
        name: "魔法使い", hp: 28, mp: 25, speed: 3, attack: 15, defense: 8, 
        spells: [SPELLS.MERA], isPlayer: true
      })
    ];
  },

  createEnemyTeam() {
    return [
      new Character({
        id: 'enemy1',
        name: "スライム", hp: 30, mp: 12, speed: 3, attack: 14, defense: 8, 
        spells: [SPELLS.MERA], isPlayer: false
      }),
      new Character({
        id: 'enemy2',
        name: "ゴーレム", hp: 60, mp: 0, speed: 2, attack: 15, defense: 18, 
        spells: [], isPlayer: false
      }),
      new Character({
        id: 'enemy3',
        name: "ドラキー", hp: 25, mp: 15, speed: 5, attack: 12, defense: 6, 
        spells: [SPELLS.SUKARA], isPlayer: false
      })
    ];
  }
};

// ================== Reactコンポーネント ==================
const BattleGame = () => {
  const [players, setPlayers] = useState([]);
  const [enemies, setEnemies] = useState([]);
  const [battleLog, setBattleLog] = useState([]);
  const [gameState, setGameState] = useState(GAME_STATES.INPUT);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [showTargetSelection, setShowTargetSelection] = useState(false);
  const [currentActionData, setCurrentActionData] = useState(null);
  const [plannedActions, setPlannedActions] = useState([]);
  const [battleResult, setBattleResult] = useState(null);
  
  const aiRef = useRef(new EnemyAI());
  
  // ログメッセージ追加
  const addLogMessage = useCallback((message) => {
    setBattleLog(prev => {
      const newLog = [...prev, message];
      return newLog.slice(-CONFIG.BATTLE.MAX_LOG_LINES);
    });
  }, []);

  // ゲーム初期化
  useEffect(() => {
    const newPlayers = CharacterFactory.createPlayerTeam();
    const newEnemies = CharacterFactory.createEnemyTeam();
    setPlayers(newPlayers);
    setEnemies(newEnemies);
    addLogMessage("戦闘開始！");
  }, [addLogMessage]);

  // プレイヤー入力処理
  const handleCommandSelection = useCallback((player, actionType, spellName = null) => {
    const targetTeam = actionType === ACTION_TYPES.DEFEND ? [player] : 
                      (actionType === ACTION_TYPES.SPELL && SpellDatabase[spellName]?.targetType === 'ally') ? players :
                      enemies;
    
    const actionData = { player, actionType, spellName, targetTeam };
    setCurrentActionData(actionData);
    
    if (actionType === ACTION_TYPES.DEFEND) {
      const action = new BattleAction(player, actionType, player, spellName);
      setPlannedActions(prev => [...prev, action]);
      moveToNextPlayer();
    } else {
      setShowTargetSelection(true);
    }
  }, [players, enemies]);

  // ターゲット選択処理
  const handleTargetSelection = useCallback((target) => {
    if (!currentActionData) return;
    
    const action = new BattleAction(
      currentActionData.player,
      currentActionData.actionType,
      target,
      currentActionData.spellName
    );
    
    setPlannedActions(prev => [...prev, action]);
    setShowTargetSelection(false);
    setCurrentActionData(null);
    moveToNextPlayer();
  }, [currentActionData]);

  // 次のプレイヤーへ移動
  const moveToNextPlayer = useCallback(() => {
    const nextIndex = currentPlayerIndex + 1;
    const nextAlivePlayerIndex = players.findIndex((p, i) => i >= nextIndex && p.alive);
    
    if (nextAlivePlayerIndex !== -1) {
      setCurrentPlayerIndex(nextAlivePlayerIndex);
    } else {
      // 全プレイヤーの入力完了、ターン実行
      executeTurn();
    }
  }, [currentPlayerIndex, players]);

  // ターン実行
  const executeTurn = useCallback(() => {
    setGameState(GAME_STATES.EXECUTING);
    
    // 敵の行動を計画
    const enemyActions = [];
    enemies.forEach(enemy => {
      const action = aiRef.current.planAction(enemy, players);
      if (action) enemyActions.push(action);
    });
    
    // 全アクションを速さ順でソート
    const allActions = [...plannedActions, ...enemyActions];
    allActions.sort((a, b) => b.actor.speed - a.actor.speed);
    
    // アクションを順次実行
    let actionIndex = 0;
    const executeNextAction = () => {
      if (actionIndex >= allActions.length) {
        endTurn();
        return;
      }
      
      const action = allActions[actionIndex];
      if (action.actor.alive && action.target && action.target.alive) {
        action.execute(addLogMessage);
        
        // キャラクター状態を更新
        setPlayers(prev => [...prev]);
        setEnemies(prev => [...prev]);
      }
      
      actionIndex++;
      setTimeout(executeNextAction, CONFIG.BATTLE.TURN_DELAY);
    };
    
    executeNextAction();
  }, [plannedActions, enemies, players, addLogMessage]);

  // ターン終了処理
  const endTurn = useCallback(() => {
    // 状態効果処理
    [...players, ...enemies].forEach(char => {
      if (char.alive) {
        char.processEndTurn(addLogMessage);
      }
    });
    
    // 戦闘終了チェック
    const alivePlayers = players.filter(p => p.alive);
    const aliveEnemies = enemies.filter(e => e.alive);
    
    if (alivePlayers.length === 0) {
      setBattleResult("全滅した…");
      setGameState(GAME_STATES.FINISHED);
    } else if (aliveEnemies.length === 0) {
      setBattleResult("敵をすべて倒した！ 勝利！");
      setGameState(GAME_STATES.FINISHED);
    } else {
      // 次のターン開始
      setPlannedActions([]);
      setCurrentPlayerIndex(players.findIndex(p => p.alive));
      setGameState(GAME_STATES.INPUT);
    }
  }, [players, enemies, addLogMessage]);

  // ゲームリスタート
  const restartGame = useCallback(() => {
    const newPlayers = CharacterFactory.createPlayerTeam();
    const newEnemies = CharacterFactory.createEnemyTeam();
    setPlayers(newPlayers);
    setEnemies(newEnemies);
    setBattleLog([]);
    setGameState(GAME_STATES.INPUT);
    setCurrentPlayerIndex(0);
    setShowTargetSelection(false);
    setCurrentActionData(null);
    setPlannedActions([]);
    setBattleResult(null);
    addLogMessage("戦闘開始！");
  }, [addLogMessage]);

  const currentPlayer = players[currentPlayerIndex];
  const aliveTargets = currentActionData?.targetTeam?.filter(char => char.alive) || [];

  return (
    <div className="min-h-screen bg-gray-900 text-white font-mono p-4">
      <div className="max-w-6xl mx-auto">
        {/* タイトル */}
        <h1 className="text-2xl text-center mb-6 text-yellow-400">ドラクエ風ターン制バトル（リファクタリング版）</h1>
        
        {/* バトルフィールド */}
        <div className="bg-gray-800 border-2 border-white rounded-lg p-6 mb-4" style={{ height: '300px' }}>
          <div className="flex justify-between h-full">
            {/* プレイヤーチーム */}
            <div className="flex flex-col justify-around">
              {players.map((player, index) => (
                <CharacterSprite 
                  key={player.id} 
                  character={player} 
                  isCurrentPlayer={gameState === GAME_STATES.INPUT && index === currentPlayerIndex}
                />
              ))}
            </div>
            
            {/* 敵チーム */}
            <div className="flex flex-col justify-around">
              {enemies.map((enemy) => (
                <CharacterSprite key={enemy.id} character={enemy} />
              ))}
            </div>
          </div>
        </div>
        
        {/* ログエリア */}
        <div className="bg-gray-800 border-2 border-white rounded-lg p-4 mb-4 h-32 overflow-y-auto">
          {battleLog.map((log, index) => (
            <div key={index} className="text-sm">{log}</div>
          ))}
        </div>
        
        {/* コマンドエリア */}
        <div className="bg-gray-800 border-2 border-white rounded-lg p-4" style={{ minHeight: '150px' }}>
          {gameState === GAME_STATES.FINISHED ? (
            <div className="text-center">
              <div className="text-xl mb-4 text-yellow-400">{battleResult}</div>
              <button 
                onClick={restartGame}
                className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded border border-white"
              >
                もう一度
              </button>
            </div>
          ) : gameState === GAME_STATES.INPUT && currentPlayer?.alive ? (
            showTargetSelection ? (
              <TargetSelection 
                targets={aliveTargets}
                onTargetSelect={handleTargetSelection}
                onCancel={() => setShowTargetSelection(false)}
              />
            ) : (
              <CommandSelection 
                player={currentPlayer}
                onCommandSelect={handleCommandSelection}
              />
            )
          ) : (
            <div className="text-center text-lg">
              {gameState === GAME_STATES.EXECUTING ? "行動実行中..." : "待機中..."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// キャラクタースプライトコンポーネント
const CharacterSprite = ({ character, isCurrentPlayer = false }) => {
  const hpRatio = MathUtils.ratio(character.hp, character.maxHp);
  const hpColor = ColorUtils.getHpColor(hpRatio);
  const borderColor = ColorUtils.getBorderColor(character);
  
  return (
    <div className="text-center">
      <div className="text-sm mb-1">{character.name}</div>
      <div 
        className={`w-20 h-16 border-2 rounded ${character.isPlayer ? 'bg-blue-600' : 'bg-red-600'} 
                   ${!character.alive ? 'opacity-30' : 'opacity-100'}
                   ${isCurrentPlayer ? 'ring-2 ring-yellow-400' : ''}`}
        style={{ borderColor }}
      />
      <div className="text-xs mt-1" style={{ color: character.alive ? hpColor : '#888888' }}>
        {character.alive ? character.getStatusDisplay() : '戦闘不能'}
      </div>
    </div>
  );
};

// コマンド選択コンポーネント
const CommandSelection = ({ player, onCommandSelect }) => {
  return (
    <div>
      <div className="mb-4 text-center">
        {player.name} ATK:{player.attack} DEF:{player.defense} のコマンドを選択
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {/* 基本コマンド */}
        <button 
          onClick={() => onCommandSelect(player, ACTION_TYPES.ATTACK)}
          className="bg-gray-600 hover:bg-gray-500 p-2 rounded border border-white text-sm"
        >
          攻撃
        </button>
        
        <button 
          onClick={() => onCommandSelect(player, ACTION_TYPES.DEFEND)}
          className="bg-gray-600 hover:bg-gray-500 p-2 rounded border border-white text-sm"
        >
          防御
        </button>
        
        {/* 呪文コマンド */} 
        {player.spells.map((spellName) => {
          const spell = SpellDatabase[spellName];
          const canCast = player.canCastSpell(spellName);
          
          return (
            <div key={spellName} className="flex flex-col">
              <button 
                onClick={() => canCast && onCommandSelect(player, ACTION_TYPES.SPELL, spellName)}
                className={`p-2 rounded border border-white text-sm mb-1
                           ${canCast ? 'bg-purple-600 hover:bg-purple-500' : 'bg-gray-700 cursor-not-allowed'}`}
                disabled={!canCast}
              >
                {spell.name}({spell.mpCost})
              </button>
              <div className={`text-xs ${canCast ? 'text-gray-300' : 'text-gray-600'}`}>
                {spell.description}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ターゲット選択コンポーネント
const TargetSelection = ({ targets, onTargetSelect, onCancel }) => {
  return (
    <div>
      <div className="mb-4 text-center">ターゲットを選択してください</div>
      
      <div className="space-y-2 max-h-32 overflow-y-auto">
        {targets.map((target) => (
          <button 
            key={target.id}
            onClick={() => onTargetSelect(target)}
            className="w-full bg-gray-600 hover:bg-gray-500 p-2 rounded border border-white text-sm text-left"
          >
            {target.getTargetDisplay()}
          </button>
        ))}
      </div>
      
      <div className="mt-4 text-center">
        <button 
          onClick={onCancel}
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded border border-white text-sm"
        >
          キャンセル
        </button>
      </div>
    </div>
  );
};

export default BattleGame;