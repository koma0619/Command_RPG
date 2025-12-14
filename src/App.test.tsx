import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Actor, BattleActor } from './types/battleTypes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const basePlayers: BattleActor[] = [
  {
    actor: {
      name: 'ガルド',
      emoji: '🛡️',
      hp: 100,
      mp: 20,
      atk: 25,
      def: 15,
      spd: 3,
      skills: ['bike_ruto'],
      isEnemy: false,
    },
    currentHp: 100,
    currentMp: 20,
    status: {},
  },
  {
    actor: {
      name: 'リナ',
      emoji: '🔮',
      hp: 85,
      mp: 35,
      atk: 18,
      def: 12,
      spd: 4,
      skills: ['hoimi'],
      isEnemy: false,
    },
    currentHp: 85,
    currentMp: 35,
    status: {},
  },
];

const baseEnemies: BattleActor[] = [
  {
    actor: {
      name: 'スライム',
      emoji: '👾',
      hp: 60,
      mp: 10,
      atk: 10,
      def: 5,
      spd: 1,
      skills: ['attack'],
      isEnemy: true,
    },
    currentHp: 60,
    currentMp: 10,
    status: {},
  },
];

let playerTeamMockData = basePlayers;
let enemyTeamMockData = baseEnemies;

const cloneTeam = (team: BattleActor[]): BattleActor[] =>
  team.map((ba) => ({
    actor: { ...ba.actor },
    currentHp: ba.currentHp,
    currentMp: ba.currentMp,
    status: { ...ba.status },
  }));

const toActorState = (team: BattleActor[]): Actor[] =>
  team.map((ba) => ({
    ...ba.actor,
    hp: ba.currentHp,
    mp: ba.currentMp,
  }));

const resolveActionsMock = vi.fn();
const determineTurnOrderMock = vi.fn();

vi.mock('./data/characterData', () => ({
  createInitialPlayerTeam: () => cloneTeam(playerTeamMockData),
  generateRandomEnemyTeam: () => cloneTeam(enemyTeamMockData),
}));

vi.mock('./engine/actionResolver', () => ({
  resolveActions: (...args: unknown[]) => resolveActionsMock(...args),
}));

vi.mock('./engine/turnOrder', () => ({
  determineTurnOrder: (...args: unknown[]) => determineTurnOrderMock(...args),
}));

import App from './App';

describe('App', () => {
  beforeEach(() => {
    playerTeamMockData = basePlayers;
    enemyTeamMockData = baseEnemies;
    determineTurnOrderMock.mockReset();
    determineTurnOrderMock.mockImplementation((actions) => actions);
    resolveActionsMock.mockReset();
    resolveActionsMock.mockImplementation((_, actors: Actor[]) => ({
      actors,
      events: [],
    }));
  });

  it('単体対象スキル選択で対象指定と保留表示が行われる', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(
      screen.getByRole('button', { name: /🛡️ ガルドのコマンドを選択/ })
    );

    await user.click(screen.getByRole('button', { name: 'バイキルト' }));

    expect(
      screen.getByText(/対象を選んでください（バイキルト）/)
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: /🔮 リナ/ })
    );

    expect(
      screen.queryByText(/対象を選んでください（バイキルト）/)
    ).not.toBeInTheDocument();

    const heroHeader = screen.getByText('🛡️ ガルド', {
      selector: '.player-header',
    });
    const heroCard = heroHeader.closest('.player-item');
    expect(heroCard).not.toBeNull();
    expect(
      within(heroCard as HTMLElement).getByText(/⏳ バイキルト/)
    ).toBeInTheDocument();
  });

  it('全員の入力完了後にターンを実行してログが出力される', async () => {
    playerTeamMockData = [basePlayers[0]];
    const customActors = toActorState([
      playerTeamMockData[0],
      enemyTeamMockData[0],
    ]);

    resolveActionsMock.mockReturnValueOnce({
      actors: [
        { ...customActors[0], hp: customActors[0].hp, mp: customActors[0].mp },
        {
          ...customActors[1],
          hp: Math.max(0, customActors[1].hp - 20),
          mp: customActors[1].mp,
        },
      ],
      events: [
        {
          actorId: 'ガルド',
          actorName: 'ガルド',
          skill: 'attack',
          targetIds: ['スライム'],
          kind: 'damage',
          detail: '20ダメージ',
        },
      ],
    });

    const user = userEvent.setup();
    render(<App />);

    await user.click(
      screen.getByRole('button', { name: /🛡️ ガルドのコマンドを選択/ })
    );
    await user.click(screen.getByRole('button', { name: /⚔️ 攻撃/ }));
    await user.click(screen.getByRole('button', { name: /👾 スライム/ }));

    const executeButton = await screen.findByRole('button', {
      name: 'ターンを実行',
    });
    await user.click(executeButton);

    expect(determineTurnOrderMock).toHaveBeenCalled();
    expect(resolveActionsMock).toHaveBeenCalledTimes(1);
    expect(
      await screen.findByText('ガルドの攻撃→20ダメージ')
    ).toBeInTheDocument();
  });
});
