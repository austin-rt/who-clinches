/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import Score from '@/app/components/Score';
import gamePicksReducer from '@/app/store/gamePicksSlice';
import uiReducer from '@/app/store/uiSlice';
import { GameLean } from '@/lib/types';

const createStore = () =>
  configureStore({
    reducer: {
      gamePicks: gamePicksReducer,
      ui: uiReducer,
    },
  });

const mockGame: GameLean = {
  _id: 'game-1',
  id: 'game-1',
  displayName: 'Team A vs Team B',
  season: 2025,
  week: 1,
  sport: 'football',
  league: 'college-football',
  state: 'pre',
  completed: false,
  conferenceGame: true,
  neutralSite: false,
  venue: { fullName: 'Stadium', city: 'City', state: 'ST', timezone: 'America/New_York' },
  date: '2025-09-06T12:00Z',
  home: {
    teamId: '1',
    abbrev: 'HME',
    displayName: 'Home Team',
    shortDisplayName: 'Home',
    logo: '',
    color: '#000',
    alternateColor: '#fff',
    score: null,
    rank: null,
    division: null,
  },
  away: {
    teamId: '2',
    abbrev: 'AWY',
    displayName: 'Away Team',
    shortDisplayName: 'Away',
    logo: '',
    color: '#000',
    alternateColor: '#fff',
    score: null,
    rank: null,
    division: null,
  },
  odds: { favoriteTeamId: null, spread: null, overUnder: null },
  predictedScore: { home: 24, away: 21 },
};

const renderScore = () => {
  const store = createStore();
  render(
    <Provider store={store}>
      <Score game={mockGame} />
    </Provider>
  );
  return store;
};

const getAwayInput = () => screen.getByTestId('score-input-away').querySelector('input')!;
const getHomeInput = () => screen.getByTestId('score-input-home').querySelector('input')!;

describe('Score input validation', () => {
  describe('handleScoreChange rejects non-numeric input', () => {
    it('rejects letters', () => {
      renderScore();
      const input = getAwayInput();
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'abc' } });
      expect(input.value).not.toBe('abc');
    });

    it('rejects decimal points', () => {
      renderScore();
      const input = getAwayInput();
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: '12.5' } });
      expect(input.value).not.toBe('12.5');
    });

    it('rejects hyphens', () => {
      renderScore();
      const input = getAwayInput();
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: '-3' } });
      expect(input.value).not.toBe('-3');
    });

    it('allows digit input', () => {
      renderScore();
      const input = getAwayInput();
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: '21' } });
      expect(input.value).toBe('21');
    });

    it('allows empty input for clearing', () => {
      renderScore();
      const input = getAwayInput();
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: '' } });
      expect(input.value).toBe('');
    });
  });

  describe('handleScoreBlur rejects invalid scores', () => {
    it('does not dispatch on tie scores', () => {
      const store = renderScore();
      const away = getAwayInput();
      const home = getHomeInput();

      fireEvent.focus(away);
      fireEvent.change(away, { target: { value: '21' } });
      fireEvent.focus(home);
      fireEvent.change(home, { target: { value: '21' } });
      fireEvent.blur(home);

      expect(store.getState().gamePicks.picks['game-1']).toBeUndefined();
    });

    it('does not dispatch on 0-0 (tie)', () => {
      const store = renderScore();
      const away = getAwayInput();
      const home = getHomeInput();

      fireEvent.focus(away);
      fireEvent.change(away, { target: { value: '' } });
      fireEvent.focus(home);
      fireEvent.change(home, { target: { value: '' } });
      fireEvent.blur(home);

      expect(store.getState().gamePicks.picks['game-1']).toBeUndefined();
    });

    it('dispatches setGamePick on valid different scores', () => {
      const store = renderScore();
      const away = getAwayInput();
      const home = getHomeInput();

      fireEvent.focus(away);
      fireEvent.change(away, { target: { value: '17' } });
      fireEvent.focus(home);
      fireEvent.change(home, { target: { value: '24' } });
      fireEvent.blur(home);

      const pick = store.getState().gamePicks.picks['game-1'];
      expect(pick).toEqual({ awayScore: 17, homeScore: 24 });
    });
  });
});
