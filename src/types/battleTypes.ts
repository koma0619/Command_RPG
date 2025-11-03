export type SkillTargetType =
  | 'enemy_single' // 敵単体
  | 'enemy_all' // 敵全体
  | 'ally_single' // 味方単体
  | 'ally_all' // 味方全体
  | 'self'; // 自分

export type SkillType =
  | 'attack_magic' // 攻撃呪文
  | 'attack_physical' // 物理攻撃特技
  | 'attack_multi' // 連続攻撃
  | 'attack_drain' // 吸収攻撃
  | 'attack_reckless' // 捨て身攻撃
  | 'attack_debuff' // 攻撃+デバフ
  | 'attack_fast' // 先制攻撃
  | 'attack_random' // ランダム攻撃
  | 'attack_gamble' // ギャンブル攻撃
  | 'buff' // バフ
  | 'debuff' // デバフ
  | 'heal' // 回復
  | 'heal_regen' // 継続回復
  | 'revive' // 蘇生
  | 'mega_revive' // メガザル
  | 'protect' // かばう
  | 'stun' // スタン
  | 'charge'; // ため

export interface BuffEffect {
  kind: 'buff' | 'debuff' | 'status';
  key: string;
  value: number;
  duration: number;
}

export interface Actor {
  id: string;
  name: string;
  emoji?: string;
  hp: number;
  mp: number;
  maxHp: number;
  maxMp: number;
  atk: number;
  def: number;
  spd: number;
  skills: string[]; // スキルIDリスト
  isEnemy: boolean;
  status: {
    [key: string]: {
      value: number;
      duration: number;
      source?: string;
    };
  };
}

export interface Skill {
  id: string; // スキルID（一意な識別子）
  name: string; // スキル名
  type: SkillType; // スキルの種類
  mpCost: number; // 消費MP
  target: SkillTargetType; // 対象の種類
  description: string; // 説明文

  // 攻撃関連
  power?: number; // 威力（物理攻撃倍率または魔法固定ダメージ）
  hits?: number; // 連続攻撃回数
  drain?: number; // HP吸収率（0.0〜1.0）
  defPenalty?: number; // 防御力ペナルティ（0.0〜1.0）

  // 効果関連
  effect?: BuffEffect; // バフ/デバフ/状態異常効果
  chance?: number; // 発動確率（0.0〜1.0）

  // 行動順
  priority?: number; // 優先度（2=防御/仁王立ち、1=疾風突き、0=通常）

  // その他
  stackable?: boolean; // バフ重複可否（true=重複可、false=上書き）
}