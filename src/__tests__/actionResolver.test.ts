import { describe, test, expect, beforeEach } from 'vitest';
import { resolveActions } from '../engine/actionResolver';
import StatusManager from '../engine/statusManager';
import type { Action } from '../engine/turnOrder';
import type { Actor } from '../types/battleTypes';

describe('actionResolver', () => {
  let sm: StatusManager;

  beforeEach(() => {
    sm = new StatusManager();
  });

  const createTestActor = (partial?: Partial<Actor>): Actor => ({
    name: 'Test Actor',
    emoji: '🤖',
    hp: 100,
    mp: 100,
    atk: 50,
    def: 30,
    spd: 3,
    skills: ['attack'],
    isEnemy: false,
    ...partial
  });

  test('基本的な攻撃解決', () => {
    const attacker = createTestActor({ name: 'attacker', atk: 50, isEnemy: false });
    const defender = createTestActor({ name: 'defender', def: 20, isEnemy: true });
    
    const action: Action = {
      actor: attacker,
      skillName: 'nagi_harai' // power: 0.6
    };

    const { actors, events } = resolveActions([action], [attacker, defender], sm);
    
    // ダメージ = atk * power - def = 50 * 0.6 - 20 = 10
    expect(events.length).toBe(1);
    expect(events[0].kind).toBe('damage');
    expect(events[0].value).toBe(10);
    
    const updatedDefender = actors.find(a => a.name === 'defender');
    expect(updatedDefender?.hp).toBe(90); // 100 - 10
  });

  test('デバフが相手のバフを解除', () => {
    const attacker = createTestActor({ name: 'attacker', isEnemy: false });
    const defender = createTestActor({ name: 'defender', isEnemy: true });
    
    // 最初に防御バフを付与
    sm.addEffectBySkill(defender.name, 'sca_ra');
    expect(sm.hasEffect(defender.name, { kind: 'buff', key: 'def', value: 0, duration: 0 })).toBe(true);

    // ルカニ（def_down）を使用
    const action: Action = {
      actor: attacker,
      skillName: 'ruka_ni'
    };

    const { events } = resolveActions([action], [attacker, defender], sm);
    
    // バフが解除されたイベントがあることを確認
    expect(events.some(e => e.kind === 'remove_buff' && e.detail === 'def')).toBe(true);
    // デバフが適用されていることを確認
    const effects = sm.getEffects(defender.name);
    expect(effects.some(e => e.effect.kind === 'debuff' && e.effect.key === 'def')).toBe(true);
  });

  test('魔法攻撃はDEFを無視してmagicShieldの影響を受ける', () => {
    const attacker = createTestActor({ name: 'attacker', isEnemy: false });
    const defender = createTestActor({ name: 'defender', def: 999, isEnemy: true }); // 高DEF
    
    // マジックバリアを付与（魔法ダメージ半減）
    sm.addEffectBySkill(defender.name, 'magic_barrier');

    // メラミで攻撃（power: 45の固定ダメージ）
    const action: Action = {
      actor: attacker,
      skillName: 'mera_mi'
    };

    const { actors, events } = resolveActions([action], [attacker, defender], sm);
    
    // ダメージ = 20 * 0.5(マジックバリア) = 10
    expect(events[0].kind).toBe('damage');
    expect(events[0].value).toBe(10);
    
    const updatedDefender = actors.find(a => a.name === 'defender');
    expect(updatedDefender?.hp).toBe(90); // 100 - 10
  });

  test('HP0以下で行動不能', () => {
    const attacker = createTestActor({ name: 'attacker', hp: 0, isEnemy: false });
    const defender = createTestActor({ name: 'defender', isEnemy: true });
    
    const action: Action = {
      actor: attacker,
      skillName: 'nagi_harai'
    };

    const { events } = resolveActions([action], [attacker, defender], sm);
    expect(events.length).toBe(0); // HP0の行動はスキップ
  });

  test('連続攻撃（hits）の処理', () => {
    const attacker = createTestActor({ name: 'attacker', atk: 50, isEnemy: false });
    const defender = createTestActor({ name: 'defender', def: 20, isEnemy: true });
    
    const action: Action = {
      actor: attacker,
      skillName: 'hayabusa_giri' // power: 0.75, hits: 2
    };

    const { events } = resolveActions([action], [attacker, defender], sm);
    
    // ダメージ = (atk * power - def) * hits = (50 * 0.75 - 20) * 2 = 18 * 2
    expect(events.filter(e => e.kind === 'damage').length).toBe(2);
    expect(events[0].value).toBe(18);
    expect(events[1].value).toBe(18);
  });

  test('吸収攻撃（drain）の処理', () => {
    const attacker = createTestActor({ name: 'attacker', atk: 50, hp: 50, isEnemy: false });
    const defender = createTestActor({ name: 'defender', def: 20, isEnemy: true });
    
    const action: Action = {
      actor: attacker,
      skillName: 'miracle_sword' // power: 1.0, drain: 0.5
    };

    const { actors, events } = resolveActions([action], [attacker, defender], sm);
    
    // ダメージ = atk * power - def = 50 * 1.0 - 20 = 30
    // 回復量 = ダメージ * drain = 30 * 0.5 = 15
    const damageEvent = events.find(e => e.kind === 'damage');
    const healEvent = events.find(e => e.kind === 'heal');
    expect(damageEvent?.value).toBe(30);
    expect(healEvent?.value).toBe(15);
    
    const updatedAttacker = actors.find(a => a.name === 'attacker');
    expect(updatedAttacker?.hp).toBe(65); // 50 + 15
  });
});
