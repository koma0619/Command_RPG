import type { Actor, BattleActor } from '@/types/battleTypes';

// モンスターデータ（敵キャラクター）
const ENEMY_CHARACTERS: Actor[] = [
  {
    name: 'ゴーレム',
    emoji: '🗿',
    hp: 100,
    mp: 40,
    atk: 35,
    def: 30,
    spd: 1,
    isEnemy: true,
    skills: [
      'niou_dachi',
      'kabuto_wari'
    ]
  },
  {
    name: 'トロル',
    emoji: '👹',
    hp: 90,
    mp: 45,
    atk: 40,
    def: 25,
    spd: 2,
    isEnemy: true,
    skills: [
      'otakebi',
      'yaiba_kuda'
    ]
  },
  {
    name: 'メガザルロック',
    emoji: '🪨',
    hp: 85,
    mp: 70,
    atk: 30,
    def: 28,
    spd: 2,
    isEnemy: true,
    skills: [
      'megazaru',
      'miracle_sword'
    ]
  },
  {
    name: 'キラーパンサー',
    emoji: '🐆',
    hp: 70,
    mp: 50,
    atk: 45,
    def: 20,
    spd: 5,
    isEnemy: true,
    skills: [
      'shippu_tsuki',
      'hayabusa_giri'
    ]
  },
  {
    name: 'バーサーカー',
    emoji: '👺',
    hp: 80,
    mp: 40,
    atk: 50,
    def: 15,
    spd: 3,
    isEnemy: true,
    skills: [
      'sutemi_kogeki',
      'nagi_harai'
    ]
  },
  {
    name: 'おおきづち',
    emoji: '🔨',
    hp: 95,
    mp: 55,
    atk: 42,
    def: 22,
    spd: 2,
    isEnemy: true,
    skills: [
      'tameru',
      'samidare_giri'
    ]
  },
  {
    name: 'メラゴースト',
    emoji: '👻',
    hp: 65,
    mp: 90,
    atk: 25,
    def: 15,
    spd: 4,
    isEnemy: true,
    skills: [
      'mera_mi',
      'mera_zoma'
    ]
  },
  {
    name: 'ベビーサタン',
    emoji: '👿',
    hp: 60,
    mp: 85,
    atk: 28,
    def: 18,
    spd: 4,
    isEnemy: true,
    skills: [
      'io_ra',
      'io_nazun'
    ]
  },
  {
    name: 'ようじゅつし',
    emoji: '🧙',
    hp: 70,
    mp: 80,
    atk: 22,
    def: 20,
    spd: 3,
    isEnemy: true,
    skills: [
      'bike_ruto',
      'hena_tos'
    ]
  },
  {
    name: 'ホイミスライム',
    emoji: '💧',
    hp: 75,
    mp: 70,
    atk: 20,
    def: 22,
    spd: 3,
    isEnemy: true,
    skills: [
      'hoimi',
      'magic_barrier'
    ]
  },
  {
    name: 'キメラ',
    emoji: '🦁',
    hp: 85,
    mp: 75,
    atk: 38,
    def: 25,
    spd: 4,
    isEnemy: true,
    skills: [
      'behomarah',
      'zaoral'
    ]
  },
  {
    name: 'メーダ',
    emoji: '🤖',
    hp: 80,
    mp: 65,
    atk: 32,
    def: 28,
    spd: 3,
    isEnemy: true,
    skills: [
      'rihoimi',
      'sca_ra'
    ]
  }
];


// プレイヤーキャラクターデータ
const PLAYER_CHARACTERS: Actor[] = [
  {
    name: 'ガルド',
    emoji: '🛡️',
    hp: 95,
    mp: 40,
    atk: 35,
    def: 32,
    spd: 2,
    isEnemy: false,
    skills: [
      'niou_dachi',
      'kabuto_wari'
    ]
  },
  {
    name: 'シェイド',
    emoji: '⚔️',
    hp: 85,
    mp: 45,
    atk: 38,
    def: 28,
    spd: 3,
    isEnemy: false,
    skills: [
      'yaiba_kuda',
      'otakebi'
    ]
  },
  {
    name: 'リオ',
    emoji: '🥋',
    hp: 75,
    mp: 50,
    atk: 45,
    def: 20,
    spd: 5,
    isEnemy: false,
    skills: [
      'shippu_tsuki',
      'hayabusa_giri'
    ]
  },
  {
    name: 'バルガス',
    emoji: '💢',
    hp: 85,
    mp: 35,
    atk: 48,
    def: 18,
    spd: 3,
    isEnemy: false,
    skills: [
      'sutemi_kogeki',
      'nagi_harai'
    ]
  },
  {
    name: 'アリア',
    emoji: '🔮',
    hp: 65,
    mp: 90,
    atk: 25,
    def: 15,
    spd: 4,
    isEnemy: false,
    skills: [
      'mera_mi',
      'mera_zoma',
      'pio_ra'
    ]
  },
  {
    name: 'ルフナ',
    emoji: '✨',
    hp: 70,
    mp: 85,
    atk: 28,
    def: 18,
    spd: 4,
    isEnemy: false,
    skills: [
      'io_ra',
      'rukani',
      'hena_tos'
    ]
  },
  {
    name: 'セレス',
    emoji: '💖',
    hp: 80,
    mp: 80,
    atk: 22,
    def: 25,
    spd: 3,
    isEnemy: false,
    skills: [
      'behomarah',
      'sca_ra',
      'zaoral'
    ]
  },
  {
    name: 'フィオナ',
    emoji: '💫',
    hp: 75,
    mp: 85,
    atk: 20,
    def: 22,
    spd: 3,
    isEnemy: false,
    skills: [
      'hoimi',
      'bike_ruto',
      'magic_barrier'
    ]
  }
];


// ランダムな敵チームを生成する
export function generateRandomEnemyTeam(): BattleActor[] {
  return ENEMY_CHARACTERS
    .slice()
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map(actor => ({
      actor: actor,
      currentHp: actor.hp,
      currentMp: actor.mp,
      status: {} // 初期ステータスは空オブジェクト
    }));
}

// 初期プレイヤーチームを生成する
export function createInitialPlayerTeam(): BattleActor[] {
  return PLAYER_CHARACTERS
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map(actor => ({
      actor: actor,
      currentHp: actor.hp,
      currentMp: actor.mp,
      status: {} // 初期ステータスは空オブジェクト
    }));
}

