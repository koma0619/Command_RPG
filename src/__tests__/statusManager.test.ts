import { describe, test, expect, beforeEach } from 'vitest';
import StatusManager from '../engine/statusManager';

describe('StatusManager', () => {
  let sm: StatusManager;

  beforeEach(() => {
    sm = new StatusManager();
  });

  test('バフ効果の追加・取得', () => {
    const ownerId = 'test_actor';
    const result = sm.addEffectBySkill(ownerId, 'bike_ruto');
    expect(result.applied).toBe(true);
    const effects = sm.getEffects(ownerId);
    expect(effects.length).toBe(1);
    expect(effects[0].effect.key).toBe('atk');
  });

  test('stackable:false のバフは重複不可', () => {
    const ownerId = 'test_actor';
    // バイキルトは stackable:false
    const first = sm.addEffectBySkill(ownerId, 'bike_ruto');
    const second = sm.addEffectBySkill(ownerId, 'bike_ruto');
    expect(first.applied).toBe(true);
    expect(second.applied).toBe(false);
    expect(second.reason).toBe('already_exists');
  });

  test('tickTurn でターン経過と効果消滅', () => {
    const ownerId = 'test_actor';
    sm.addEffectBySkill(ownerId, 'bike_ruto'); // duration: 3
    
    // 1ターン経過
    let removed = sm.tickTurn().removed;
    expect(removed.length).toBe(0);
    let effects = sm.getEffects(ownerId);
    expect(effects[0].remainingTurns).toBe(2);

    // 2ターン経過
    removed = sm.tickTurn().removed;
    expect(removed.length).toBe(0);
    effects = sm.getEffects(ownerId);
    expect(effects[0].remainingTurns).toBe(1);

    // 3ターン経過で消滅
    removed = sm.tickTurn().removed;
    expect(removed.length).toBe(1);
    expect(removed[0].effect.key).toBe('atk');
    effects = sm.getEffects(ownerId);
    expect(effects.length).toBe(0);
  });

  test('computeModifiedStats でステータス計算', () => {
    const ownerId = 'test_actor';
    const base = { atk: 100, def: 100, spd: 3 };
    
    // 初期状態
    let stats = sm.computeModifiedStats(base, ownerId);
    expect(stats).toEqual({ atk: 100, def: 100, spd: 3, magicShield: 1 });

    // バイキルト（atk_up: x1.5）
    sm.addEffectBySkill(ownerId, 'bike_ruto');
    stats = sm.computeModifiedStats(base, ownerId);
    expect(stats.atk).toBe(150); // 100 * 1.5

    // マジックバリア（魔法ダメージ半減）
    sm.addEffectBySkill(ownerId, 'magic_barrier');
    stats = sm.computeModifiedStats(base, ownerId);
    expect(stats.magicShield).toBe(0.5);
  });

  test('removeEffect で効果を削除', () => {
    const ownerId = 'test_actor';
    sm.addEffectBySkill(ownerId, 'bike_ruto');
    
    const removed = sm.removeEffect(ownerId, 'atk');
    expect(removed.length).toBe(1);
    expect(removed[0].effect.key).toBe('atk');
    
    const effects = sm.getEffects(ownerId);
    expect(effects.length).toBe(0);
  });
});
