import type { Actor } from '@/types/battleTypes';

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
      'ninoudate',
      'kabuwari'
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
      'yaiba_kudaki'
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
      'shipputsuki',
      'hayabusagiri'
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
      'sutemi_attack',
      'nagisabari'
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
      'samidare_zuki'
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
      'merami',
      'merazoma'
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
      'iora',
      'ionazun'
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
      'bikilt',
      'henatos'
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
      'magicbarrier'
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
      'scara'
    ]
  }
];

// ランダムな敵チームを生成する
export function generateRandomEnemyTeam(): Actor[] {
  return ENEMY_CHARACTERS
    .slice()
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map(enemy => ({
      ...enemy,
      status: {} // 初期ステータスは空オブジェクト
    }));
}

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
      'ninoudate',
      'kabuwari'
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
      'yaiba_kudaki',
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
      'shipputsuki',
      'hayabusagiri'
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
      'sutemi_attack',
      'nagisabari'
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
      'merami',
      'merazoma',
      'piora'
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
      'iora',
      'rukani',
      'henatos'
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
      'scara',
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
      'bikilt',
      'magicbarrier'
    ]
  }
];

// 初期プレイヤーチームを生成する
export function createInitialPlayerTeam(): Actor[] {
  return PLAYER_CHARACTERS
    .slice(0, 3)
    .map(player => ({
      ...player,
      status: {} // 初期ステータスは空オブジェクト
    }));
}

