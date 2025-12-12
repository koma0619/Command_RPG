import { describe, test, expect, beforeEach } from 'vitest';
import { resolveActions, type ResolveEvent } from '../engine/actionResolver';
import StatusManager from '../engine/statusManager';
import type { Actor, Action } from '../engine/turnOrder';

describe('actionResolver', () => {
  let sm: StatusManager;

  beforeEach(() => {
    sm = new StatusManager();
  });

  const createTestActor = (partial?: Partial<Actor>): Actor => ({
    id: 'test_id',
    name: 'Test Actor',
    hp: 100,
    mp: 100,
    atk: 50,
    def: 30,
    spd: 3,
    emoji: '🤖',
    isPlayer: true,
    ...partial
  });

  test('基本的な攻撃解決', () => {
    const attacker = createTestActor({ id: 'attacker', atk: 50 });
    const defender = createTestActor({ id: 'defender', def: 20 });
    
    const action: Action = {
      actor: attacker,
      skillName: 'なぎ払い' // power: 0.7
    };

    const { actors, events } = resolveActions([action], [attacker, defender], sm);
    
    // ダメージ = atk * power - def = 50 * 0.7 - 20 = 15
    expect(events.length).toBe(1);
    expect(events[0].kind).toBe('damage');
    expect(events[0].value).toBe(15);
    
    const updatedDefender = actors.find(a => a.id === 'defender');
    expect(updatedDefender?.hp).toBe(85); // 100 - 15
  });

  test('デバフが相手のバフを解除', () => {
    const attacker = createTestActor({ id: 'attacker' });
    const defender = createTestActor({ id: 'defender' });
    
    // 最初に防御バフを付与
    sm.addEffectBySkill(defender.id, 'スカラ');
    expect(sm.hasEffect(defender.id, 'def_up')).toBe(true);

    // ルカニ（def_down）を使用
    const action: Action = {
      actor: attacker,
      skillName: 'ルカニ'
    };

    const { events } = resolveActions([action], [attacker, defender], sm);
    
    // バフが解除されたイベントがあることを確認
    expect(events.some(e => e.kind === 'remove_buff' && e.detail === 'def_up')).toBe(true);
    // 解除後は def_up が無くなっているはず
    expect(sm.hasEffect(defender.id, 'def_up')).toBe(false);
  });

  test('魔法攻撃はDEFを無視してmagicShieldの影響を受ける', () => {
    const attacker = createTestActor({ id: 'attacker' });
    const defender = createTestActor({ id: 'defender', def: 999 }); // 高DEF
    
    // マジックバリアを付与（魔法ダメージ半減）
    sm.addEffectBySkill(defender.id, 'マジックバリア');

    // メラミで攻撃（power: 45の固定ダメージ）
    const action: Action = {
      actor: attacker,
      skillName: 'メラミ'
    };

    const { actors, events } = resolveActions([action], [attacker, defender], sm);
    
    // ダメージ = 45 * 0.5(マジックバリア) = 23 (切り上げ)
    expect(events[0].kind).toBe('damage');
    expect(events[0].value).toBe(23);
    
    const updatedDefender = actors.find(a => a.id === 'defender');
    expect(updatedDefender?.hp).toBe(77); // 100 - 23
  });

  test('HP0以下で行動不能', () => {
    const attacker = createTestActor({ id: 'attacker', hp: 0 });
    const defender = createTestActor({ id: 'defender' });
    
    const action: Action = {
      actor: attacker,
      skillName: 'なぎ払い'
    };

    const { events } = resolveActions([action], [attacker, defender], sm);
    expect(events.length).toBe(0); // HP0の行動はスキップ
  });

  test('連続攻撃（hits）の処理', () => {
    const attacker = createTestActor({ id: 'attacker', atk: 50 });
    const defender = createTestActor({ id: 'defender', def: 20 });
    
    const action: Action = {
      actor: attacker,
      skillName: 'はやぶさ斬り' // power: 0.75, hits: 2
    };

    const { events } = resolveActions([action], [attacker, defender], sm);
    
    // ダメージ = (atk * power - def) * hits = (50 * 0.75 - 20) * 2 = 18 * 2
    expect(events.filter(e => e.kind === 'damage').length).toBe(2);
    expect(events[0].value).toBe(18);
    expect(events[1].value).toBe(18);
  });

  test('吸収攻撃（drain）の処理', () => {
    const attacker = createTestActor({ id: 'attacker', atk: 50, hp: 50 });
    const defender = createTestActor({ id: 'defender', def: 20 });
    
    const action: Action = {
      actor: attacker,
      skillName: 'ミラクルソード' // power: 1.0, drain: 0.5
    };

    const { actors, events } = resolveActions([action], [attacker, defender], sm);
    
    // ダメージ = atk * power - def = 50 * 1.0 - 20 = 30
    // 回復量 = ダメージ * drain = 30 * 0.5 = 15
    const damageEvent = events.find(e => e.kind === 'damage');
    const healEvent = events.find(e => e.kind === 'heal');
    expect(damageEvent?.value).toBe(30);
    expect(healEvent?.value).toBe(15);
    
    const updatedAttacker = actors.find(a => a.id === 'attacker');
    expect(updatedAttacker?.hp).toBe(65); // 50 + 15
  });
});