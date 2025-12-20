# Command RPG

## プロジェクト概要
React + TypeScript で作るコマンド選択式RPGの戦闘デモです。プレイヤーは味方全員の行動をキューに積み、敵は自動で行動を選択します。実行順の決定、行動解決、バフ/デバフの管理などの戦闘コアをフロント側で完結させています。

## 仕様メモ
- コマンド入力: 生存しているプレイヤー全員の行動が揃うまでターン実行不可。`ensureAllPlayersQueued` で検証。
- 行動順: `skill.priority` → `actor.spd` → 乱数の優先順位で並び替え。`determineTurnOrder` で決定。
- MP消費: ターン開始時にスキルコストを差し引き。`executeBattleTurn` 内で反映。
- 行動解決: `resolveActions` がダメージ/回復/バフ/デバフ/蘇生/ミスをイベントとして返す。
- ダメージ計算:
  - 物理: `attacker.atk * power - target.def`（最小1）
  - 魔法: 固定 `power`、防御無視、`magic_shield` で倍率軽減
- 状態異常:
  - `StatusManager` が効果の持続ターンを管理し、ターン経過で減衰
  - `stackable=false` の効果は同一効果の重複付与不可
  - 対立効果（バフ/デバフ）は先に解除してから付与
