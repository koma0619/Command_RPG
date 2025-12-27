import type { Actor, ActorStats } from './battleTypes';

// 役割の定義
export type Role = 'tank' | 'attacker' | 'mage' | 'healer' | 'support';

// キャラクター作成用テンプレート（ゲーム開始時に選ぶベース）
export interface CharacterTemplate {
  id: string;
  name: string;
  emoji?: string;
  role?: Role;
  // 基本ステータス（固定）
  stats: ActorStats;
  // スキルはスキルIDの配列で定義する（データ駆動）
  skills: string[];
}

// 実行時に使うキャラクターデータは既存の Actor を再利用
export type Character = Actor;

// ヘルパー型: チーム（プレイヤー側/敵側）の配列
export type Team = Character[];
