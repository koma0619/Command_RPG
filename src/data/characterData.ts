import type { Actor, BattleActor } from '@/types/battleTypes';
import type { SkillId } from '@/types/skillIds';

// モンスターデータ（敵キャラクター）
const ENEMY_CHARACTERS: Actor[] = [
  {
    name: 'ゴーレム',
    emoji: '🗿',
    stats: {
      hp: 100,
      mp: 40,
      atk: 40,
      def: 20,
      spd: 1,
    },
    isEnemy: true,
    skills: [
      'niou_dachi',
      'kabuto_wari'
    ] satisfies SkillId[]
  },
  {
    name: 'トロル',
    emoji: '👹',
    stats: {
      hp: 90,
      mp: 45,
      atk: 44,
      def: 20,
      spd: 2,
    },
    isEnemy: true,
    skills: [
      'otakebi',
      'yaiba_kuda'
    ] satisfies SkillId[]
  },
  {
    name: 'メガザルロック',
    emoji: '🪨',
    stats: {
      hp: 85,
      mp: 70,
      atk: 32,
      def: 20,
      spd: 2,
    },
    isEnemy: true,
    skills: [
      'mega_zaru',
      'miracle_sword'
    ] satisfies SkillId[]
  },
  {
    name: 'キラーパンサー',
    emoji: '🐆',
    stats: {
      hp: 70,
      mp: 50,
      atk: 48,
      def: 20,
      spd: 5,
    },
    isEnemy: true,
    skills: [
      'shippu_tsuki',
      'hayabusa_giri'
    ] satisfies SkillId[]
  },
  {
    name: 'バーサーカー',
    emoji: '👺',
    stats: {
      hp: 80,
      mp: 40,
      atk: 46,
      def: 20,
      spd: 3,
    },
    isEnemy: true,
    skills: [
      'sutemi_kogeki',
      'nagi_harai'
    ] satisfies SkillId[]
  },
  {
    name: 'おおきづち',
    emoji: '🔨',
    stats: {
      hp: 95,
      mp: 55,
      atk: 44,
      def: 20,
      spd: 2,
    },
    isEnemy: true,
    skills: [
      'tameru',
      'samidare_giri'
    ] satisfies SkillId[]
  },
  {
    name: 'メラゴースト',
    emoji: '👻',
    stats: {
      hp: 65,
      mp: 90,
      atk: 32,
      def: 20,
      spd: 4,
    },
    isEnemy: true,
    skills: [
      'mera_mi',
      'mera_zoma'
    ] satisfies SkillId[]
  },
  {
    name: 'ベビーサタン',
    emoji: '👿',
    stats: {
      hp: 60,
      mp: 85,
      atk: 36,
      def: 20,
      spd: 4,
    },
    isEnemy: true,
    skills: [
      'io_ra',
      'io_nazun'
    ] satisfies SkillId[]
  },
  {
    name: 'ようじゅつし',
    emoji: '🧙',
    stats: {
      hp: 70,
      mp: 80,
      atk: 34,
      def: 20,
      spd: 3,
    },
    isEnemy: true,
    skills: [
      'bike_ruto',
      'hena_tos'
    ] satisfies SkillId[]
  },
  {
    name: 'ホイミスライム',
    emoji: '💧',
    stats: {
      hp: 75,
      mp: 70,
      atk: 32,
      def: 20,
      spd: 3,
    },
    isEnemy: true,
    skills: [
      'hoimi',
      'magic_barrier'
    ] satisfies SkillId[]
  },
  {
    name: 'キメラ',
    emoji: '🦁',
    stats: {
      hp: 85,
      mp: 75,
      atk: 42,
      def: 20,
      spd: 4,
    },
    isEnemy: true,
    skills: [
      'behomarah',
      'zaoral'
    ] satisfies SkillId[]
  },
  {
    name: 'メーダ',
    emoji: '🤖',
    stats: {
      hp: 80,
      mp: 65,
      atk: 36,
      def: 20,
      spd: 3,
    },
    isEnemy: true,
    skills: [
      'rihoimi',
      'sca_ra'
    ] satisfies SkillId[]
  }
];


// プレイヤーキャラクターデータ
const PLAYER_CHARACTERS: Actor[] = [
  {
    name: 'ガルド',
    emoji: '🛡️',
    stats: {
      hp: 95,
      mp: 40,
      atk: 40,
      def: 20,
      spd: 2,
    },
    isEnemy: false,
    skills: [
      'niou_dachi',
      'kabuto_wari'
    ] satisfies SkillId[]
  },
  {
    name: 'シェイド',
    emoji: '⚔️',
    stats: {
      hp: 85,
      mp: 45,
      atk: 44,
      def: 20,
      spd: 3,
    },
    isEnemy: false,
    skills: [
      'yaiba_kuda',
      'otakebi'
    ] satisfies SkillId[]
  },
  {
    name: 'リオ',
    emoji: '🥋',
    stats: {
      hp: 75,
      mp: 50,
      atk: 48,
      def: 20,
      spd: 5,
    },
    isEnemy: false,
    skills: [
      'shippu_tsuki',
      'hayabusa_giri'
    ] satisfies SkillId[]
  },
  {
    name: 'バルガス',
    emoji: '💢',
    stats: {
      hp: 85,
      mp: 35,
      atk: 46,
      def: 20,
      spd: 3,
    },
    isEnemy: false,
    skills: [
      'sutemi_kogeki',
      'nagi_harai'
    ] satisfies SkillId[]
  },
  {
    name: 'アリア',
    emoji: '🔮',
    stats: {
      hp: 65,
      mp: 90,
      atk: 32,
      def: 20,
      spd: 4,
    },
    isEnemy: false,
    skills: [
      'mera_mi',
      'mera_zoma',
      'pio_ra'
    ] satisfies SkillId[]
  },
  {
    name: 'ルフナ',
    emoji: '✨',
    stats: {
      hp: 70,
      mp: 85,
      atk: 36,
      def: 20,
      spd: 4,
    },
    isEnemy: false,
    skills: [
      'io_ra',
      'ruka_ni',
      'hena_tos'
    ] satisfies SkillId[]
  },
  {
    name: 'セレス',
    emoji: '💖',
    stats: {
      hp: 80,
      mp: 80,
      atk: 34,
      def: 20,
      spd: 3,
    },
    isEnemy: false,
    skills: [
      'behomarah',
      'sca_ra',
      'zaoral'
    ] satisfies SkillId[]
  },
  {
    name: 'フィオナ',
    emoji: '💫',
    stats: {
      hp: 75,
      mp: 85,
      atk: 32,
      def: 20,
      spd: 3,
    },
    isEnemy: false,
    skills: [
      'hoimi',
      'bike_ruto',
      'magic_barrier'
    ] satisfies SkillId[]
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
      currentHp: actor.stats.hp,
      currentMp: actor.stats.mp,
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
      currentHp: actor.stats.hp,
      currentMp: actor.stats.mp,
      status: {} // 初期ステータスは空オブジェクト
    }));
}

