// ========================================
// スキルタイプ定義
// ========================================

export type SkillTargetType = 
  | 'enemy_single'    // 敵単体
  | 'enemy_all'       // 敵全体
  | 'ally_single'     // 味方単体
  | 'ally_all'        // 味方全体
  | 'self';           // 自分

export type SkillType =
  | 'attack_magic'      // 攻撃呪文
  | 'attack_physical'   // 物理攻撃特技
  | 'attack_multi'      // 連続攻撃
  | 'attack_drain'      // 吸収攻撃
  | 'attack_reckless'   // 捨て身攻撃
  | 'attack_debuff'     // 攻撃+デバフ
  | 'attack_fast'       // 先制攻撃
  | 'attack_random'     // ランダム攻撃
  | 'attack_gamble'     // ギャンブル攻撃
  | 'buff'              // バフ
  | 'debuff'            // デバフ
  | 'heal'              // 回復
  | 'heal_regen'        // 継続回復
  | 'revive'            // 蘇生
  | 'mega_revive'       // メガザル
  | 'protect'           // かばう
  | 'stun'              // スタン
  | 'charge';           // ため

export type BuffDebuffEffect =
  | 'atk_up'          // 攻撃力アップ
  | 'def_up'          // 防御力アップ
  | 'spd_up'          // 素早さアップ
  | 'magic_shield'    // 魔法ダメージ軽減
  | 'atk_down'        // 攻撃力ダウン
  | 'def_down';       // 防御力ダウン

// ========================================
// スキルインターフェース
// ========================================

export interface Skill {
  name: string;
  type: SkillType;
  mp: number;
  target: SkillTargetType;
  power?: number;           // 威力倍率（物理）or 固定ダメージ（魔法）
  hits?: number;            // 攻撃回数
  drain?: number;           // ドレイン倍率
  effect?: BuffDebuffEffect;
  value?: number;           // バフ/デバフの効果値
  duration?: number;        // 効果継続ターン数
  chance?: number;          // 発動確率（0.0〜1.0）
  priority?: boolean;       // 先制行動
  defPenalty?: number;      // 防御力ペナルティ
  description: string;      // 説明文
}

// ========================================
// スキルデータ
// ========================================

export const SKILLS: Record<string, Skill> = {
  // ============ 攻撃呪文 ============
  'メラミ': {
    name: 'メラミ',
    type: 'attack_magic',
    mp: 8,
    power: 45,
    target: 'enemy_single',
    description: '敵単体に中ダメージの炎系呪文'
  },
  
  'メラゾーマ': {
    name: 'メラゾーマ',
    type: 'attack_magic',
    mp: 15,
    power: 80,
    target: 'enemy_single',
    description: '敵単体に大ダメージの炎系呪文'
  },
  
  'イオラ': {
    name: 'イオラ',
    type: 'attack_magic',
    mp: 12,
    power: 40,
    target: 'enemy_all',
    description: '敵全体に中ダメージの爆発系呪文'
  },
  
  'イオナズン': {
    name: 'イオナズン',
    type: 'attack_magic',
    mp: 20,
    power: 70,
    target: 'enemy_all',
    description: '敵全体に大ダメージの爆発系呪文'
  },

  // ============ 補助呪文 ============
  'バイキルト': {
    name: 'バイキルト',
    type: 'buff',
    mp: 6,
    effect: 'atk_up',
    value: 1.5,
    duration: 5,
    target: 'ally_single',
    description: '味方1人の攻撃力を上げる'
  },
  
  'スカラ': {
    name: 'スカラ',
    type: 'buff',
    mp: 4,
    effect: 'def_up',
    value: 1.5,
    duration: 5,
    target: 'ally_single',
    description: '味方1人の防御力を上げる'
  },
  
  'ピオラ': {
    name: 'ピオラ',
    type: 'buff',
    mp: 4,
    effect: 'spd_up',
    value: 1,
    duration: 5,
    target: 'ally_single',
    description: '味方1人の素早さを上げる'
  },
  
  'マジックバリア': {
    name: 'マジックバリア',
    type: 'buff',
    mp: 8,
    effect: 'magic_shield',
    value: 0.5,
    duration: 3,
    target: 'ally_all',
    description: '味方全員の呪文ダメージを半減'
  },
  
  'ルカニ': {
    name: 'ルカニ',
    type: 'debuff',
    mp: 5,
    effect: 'def_down',
    value: 0.5,
    duration: 3,
    target: 'enemy_single',
    description: '敵1体の防御力を下げる'
  },
  
  'ヘナトス': {
    name: 'ヘナトス',
    type: 'debuff',
    mp: 5,
    effect: 'atk_down',
    value: 0.5,
    duration: 3,
    target: 'enemy_single',
    description: '敵1体の攻撃力を下げる'
  },

  // ============ 攻撃特技 ============
  '兜割り': {
    name: '兜割り',
    type: 'attack_debuff',
    mp: 4,
    power: 0.8,
    effect: 'def_down',
    value: 0.5,
    duration: 3,
    chance: 0.5,
    target: 'enemy_single',
    description: '攻撃して50%で敵の防御力を下げる'
  },
  
  '刃砕き': {
    name: '刃砕き',
    type: 'attack_debuff',
    mp: 4,
    power: 0.8,
    effect: 'atk_down',
    value: 0.5,
    duration: 3,
    chance: 0.5,
    target: 'enemy_single',
    description: '攻撃して50%で敵の攻撃力を下げる'
  },
  
  '疾風突き': {
    name: '疾風突き',
    type: 'attack_fast',
    mp: 3,
    power: 0.75,
    priority: true,
    target: 'enemy_single',
    description: '必ず先制して0.75倍のダメージを与える'
  },
  
  '五月雨突き': {
    name: '五月雨突き',
    type: 'attack_random',
    mp: 5,
    power: 0.5,
    hits: 4,
    target: 'enemy_all',
    description: '0.5倍のダメージをランダムに4回'
  },
  
  '魔人斬り': {
    name: '魔人斬り',
    type: 'attack_gamble',
    mp: 6,
    power: 2.5,
    chance: 0.5,
    target: 'enemy_single',
    description: '50%で大ダメージ、失敗でミス'
  },
  
  'なぎ払い': {
    name: 'なぎ払い',
    type: 'attack_physical',
    mp: 5,
    power: 0.7,
    target: 'enemy_all',
    description: '敵全体にダメージ'
  },
  
  'はやぶさ斬り': {
    name: 'はやぶさ斬り',
    type: 'attack_multi',
    mp: 4,
    power: 0.75,
    hits: 2,
    target: 'enemy_single',
    description: '0.75倍のダメージを2回'
  },
  
  'ミラクルソード': {
    name: 'ミラクルソード',
    type: 'attack_drain',
    mp: 6,
    power: 1.0,
    drain: 0.5,
    target: 'enemy_single',
    description: '与えたダメージの半分を回復'
  },
  
  '捨て身攻撃': {
    name: '捨て身攻撃',
    type: 'attack_reckless',
    mp: 0,
    power: 2.0,
    defPenalty: 0.5,
    target: 'enemy_single',
    description: 'ダメージ2倍だが防御力半減'
  },

  // ============ 補助特技 ============
  '仁王立ち': {
    name: '仁王立ち',
    type: 'protect',
    mp: 0,
    duration: 1,
    priority: true,
    target: 'self',
    description: '味方へのダメージを全て引き受ける'
  },
  
  'おたけび': {
    name: 'おたけび',
    type: 'stun',
    mp: 5,
    chance: 0.33,
    target: 'enemy_all',
    description: '33%の確率で敵を1ターン休みにする'
  },
  
  'ためる': {
    name: 'ためる',
    type: 'charge',
    mp: 0,
    value: 2.5,
    target: 'self',
    description: '次のターンのダメージが2.5倍'
  },

  // ============ 回復 ============
  'ホイミ': {
    name: 'ホイミ',
    type: 'heal',
    mp: 5,
    power: 40,
    target: 'ally_single',
    description: '味方1人のHPを回復'
  },
  
  'ベホマラー': {
    name: 'ベホマラー',
    type: 'heal',
    mp: 15,
    power: 60,
    target: 'ally_all',
    description: '味方全員のHPを回復'
  },
  
  'リホイミ': {
    name: 'リホイミ',
    type: 'heal_regen',
    mp: 6,
    power: 15,
    duration: 3,
    target: 'ally_single',
    description: '3ターンの間、毎ターン小回復'
  },

  // ============ 蘇生 ============
  'ザオラル': {
    name: 'ザオラル',
    type: 'revive',
    mp: 20,
    chance: 1.0,
    target: 'ally_single',
    description: '戦闘不能の味方を蘇生'
  },
  
  'メガザル': {
    name: 'メガザル',
    type: 'mega_revive',
    mp: 0,
    target: 'ally_all',
    description: '自分は倒れるが味方全員を全回復&蘇生'
  },
};

// ========================================
// モンスターステータス定義
// ========================================

export interface MonsterStats {
  id: string;
  name: string;
  emoji: string;
  hp: number;
  mp: number;
  atk: number;
  def: number;
  spd: number;
  skills: string[];
  role: 'tank' | 'attacker' | 'mage' | 'healer' | 'support';
  description: string;
}

// ========================================
// モンスターデータ
// ========================================

export const MONSTERS: Record<string, MonsterStats> = {
  // ============ タンク系 ============
  golem: {
    id: 'golem',
    name: 'ゴーレム',
    emoji: '🗿',
    hp: 150,
    mp: 20,
    atk: 25,
    def: 40,
    spd: 2,
    skills: ['仁王立ち', '兜割り'],
    role: 'tank',
    description: '石の体を持つ鉄壁の守護者'
  },
  
  troll: {
    id: 'troll',
    name: 'トロル',
    emoji: '👹',
    hp: 130,
    mp: 30,
    atk: 35,
    def: 28,
    spd: 2,
    skills: ['おたけび', '刃砕き'],
    role: 'tank',
    description: '怪力と威圧で敵を妨害する'
  },

  // ============ アタッカー系 ============
  killer_panther: {
    id: 'killer_panther',
    name: 'キラーパンサー',
    emoji: '🐆',
    hp: 110,
    mp: 25,
    atk: 32,
    def: 20,
    spd: 5,
    skills: ['疾風突き', 'はやぶさ斬り'],
    role: 'attacker',
    description: '俊敏な動きで敵を翻弄する'
  },
  
  berserker: {
    id: 'berserker',
    name: 'バーサーカー',
    emoji: '⚔️',
    hp: 140,
    mp: 20,
    atk: 40,
    def: 22,
    spd: 2,
    skills: ['捨て身攻撃', 'なぎ払い'],
    role: 'attacker',
    description: '一撃必殺の荒くれ戦士'
  },
  
  ookizuchi: {
    id: 'ookizuchi',
    name: 'おおきづち',
    emoji: '🔨',
    hp: 125,
    mp: 15,
    atk: 36,
    def: 25,
    spd: 2,
    skills: ['ためる', '五月雨突き'],
    role: 'attacker',
    description: '巨大なハンマーを振り回す'
  },

  // ============ メイジ系 ============
  mera_ghost: {
    id: 'mera_ghost',
    name: 'メラゴースト',
    emoji: '🔥',
    hp: 90,
    mp: 60,
    atk: 25,
    def: 18,
    spd: 3,
    skills: ['メラミ', 'メラゾーマ'],
    role: 'mage',
    description: '炎の呪文を操る火炎の精霊'
  },
  
  baby_satan: {
    id: 'baby_satan',
    name: 'ベビーサタン',
    emoji: '😈',
    hp: 95,
    mp: 55,
    atk: 23,
    def: 20,
    spd: 3,
    skills: ['イオラ', 'イオナズン'],
    role: 'mage',
    description: '爆発呪文で敵を一網打尽'
  },

  // ============ サポート系 ============
  youjutsushi: {
    id: 'youjutsushi',
    name: 'ようじゅつし',
    emoji: '🧙',
    hp: 100,
    mp: 50,
    atk: 22,
    def: 22,
    spd: 3,
    skills: ['バイキルト', 'ヘナトス'],
    role: 'support',
    description: 'バフとデバフを使いこなす妖術の使い手'
  },

  // ============ ヒーラー系 ============
  hoimi_slime: {
    id: 'hoimi_slime',
    name: 'ホイミスライム',
    emoji: '💧',
    hp: 105,
    mp: 65,
    atk: 22,
    def: 23,
    spd: 3,
    skills: ['ホイミ', 'マジックバリア'],
    role: 'healer',
    description: '回復と防御魔法で仲間を支える'
  },
  
  chimera: {
    id: 'chimera',
    name: 'キメラ',
    emoji: '🦅',
    hp: 100,
    mp: 70,
    atk: 20,
    def: 25,
    spd: 4,
    skills: ['ベホマラー', 'ザオラル'],
    role: 'healer',
    description: '全体回復と蘇生の頼れる仲間'
  },
  
  meda: {
    id: 'meda',
    name: 'メーダ',
    emoji: '👁️',
    hp: 110,
    mp: 60,
    atk: 24,
    def: 26,
    spd: 3,
    skills: ['リホイミ', 'スカラ'],
    role: 'healer',
    description: '継続回復で長期戦を支える'
  },
  
  megazal_rock: {
    id: 'megazal_rock',
    name: 'メガザルロック',
    emoji: '💎',
    hp: 120,
    mp: 40,
    atk: 28,
    def: 30,
    spd: 2,
    skills: ['メガザル', 'ミラクルソード'],
    role: 'healer',
    description: '究極の犠牲で仲間を救う岩石'
  },
};

// ========================================
// ヘルパー関数
// ========================================

/**
 * モンスターIDからモンスターデータを取得
 */
export const getMonster = (id: string): MonsterStats | undefined => {
  return MONSTERS[id];
};

/**
 * スキル名からスキルデータを取得
 */
export const getSkill = (name: string): Skill | undefined => {
  return SKILLS[name];
};

/**
 * ロール別にモンスターを取得
 */
export const getMonstersByRole = (role: MonsterStats['role']): MonsterStats[] => {
  return Object.values(MONSTERS).filter(m => m.role === role);
};

/**
 * ランダムなモンスターを取得
 */
export const getRandomMonster = (): MonsterStats => {
  const monsters = Object.values(MONSTERS);
  return monsters[Math.floor(Math.random() * monsters.length)];
};

/**
 * ランダムな敵チームを生成（3体）
 */
export const generateRandomEnemyTeam = (): MonsterStats[] => {
  const monsters = Object.values(MONSTERS);
  const team: MonsterStats[] = [];
  
  for (let i = 0; i < 3; i++) {
    const randomMonster = monsters[Math.floor(Math.random() * monsters.length)];
    team.push({ ...randomMonster });
  }
  
  return team;
};

/**
 * バランスの取れた敵チームを生成
 * タンク/アタッカー/サポートorヒーラーの組み合わせ
 */
export const generateBalancedEnemyTeam = (): MonsterStats[] => {
  const tanks = getMonstersByRole('tank');
  const attackers = getMonstersByRole('attacker');
  const supports = [...getMonstersByRole('support'), ...getMonstersByRole('healer'), ...getMonstersByRole('mage')];
  
  const team = [
    tanks[Math.floor(Math.random() * tanks.length)],
    attackers[Math.floor(Math.random() * attackers.length)],
    supports[Math.floor(Math.random() * supports.length)]
  ];
  
  return team.map(m => ({ ...m }));
};