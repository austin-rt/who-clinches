import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface ChatSession {
  id: string;
  messages: ChatMessage[];
  label: string;
  conf?: string;
  lastActiveAt?: number;
}

interface UsageInfo {
  freeRemaining: number;
  creditsRemaining: number;
  source: 'free' | 'credits' | null;
}

interface ChatState {
  sessions: ChatSession[];
  activeSessionIndex: number;
  drawerOpen: boolean;
  email: string | null;
  usage: UsageInfo | null;
  history: ChatSession[];
}

const initialState: ChatState = {
  sessions: [],
  activeSessionIndex: 0,
  drawerOpen: true,
  email: null,
  usage: null,
  history: [],
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setSessions: (state, action: PayloadAction<ChatSession[]>) => {
      state.sessions = action.payload;
    },
    setActiveSessionIndex: (state, action: PayloadAction<number>) => {
      state.activeSessionIndex = action.payload;
    },
    setDrawerOpen: (state, action: PayloadAction<boolean>) => {
      state.drawerOpen = action.payload;
    },
    addMessage: (state, action: PayloadAction<{ sessionIndex: number; message: ChatMessage }>) => {
      const session = state.sessions[action.payload.sessionIndex];
      if (session) {
        session.messages.push(action.payload.message);
      }
    },
    updateLastMessage: (
      state,
      action: PayloadAction<{ sessionIndex: number; content: string }>
    ) => {
      const session = state.sessions[action.payload.sessionIndex];
      if (session && session.messages.length > 0) {
        const last = session.messages[session.messages.length - 1];
        last.content = action.payload.content;
      }
    },
    addSession: (state, action: PayloadAction<ChatSession>) => {
      state.sessions.push(action.payload);
      state.activeSessionIndex = state.sessions.length - 1;
    },
    removeSession: (state, action: PayloadAction<number>) => {
      state.sessions.splice(action.payload, 1);
      if (state.activeSessionIndex >= state.sessions.length) {
        state.activeSessionIndex = Math.max(0, state.sessions.length - 1);
      }
    },
    clearSessions: (state) => {
      state.sessions = [];
      state.activeSessionIndex = 0;
    },
    setEmail: (state, action: PayloadAction<string | null>) => {
      state.email = action.payload;
    },
    setUsage: (state, action: PayloadAction<UsageInfo | null>) => {
      state.usage = action.payload;
    },
    addToHistory: (state, action: PayloadAction<ChatSession>) => {
      state.history = [action.payload, ...state.history].slice(0, 20);
    },
    removeFromHistory: (state, action: PayloadAction<string>) => {
      state.history = state.history.filter((s) => s.id !== action.payload);
    },
    pruneExpiredSessions: (state) => {
      const cutoff = Date.now() - 24 * 60 * 60 * 1000;
      const expired: ChatSession[] = [];
      const kept: ChatSession[] = [];
      for (const s of state.sessions) {
        if (s.lastActiveAt && s.lastActiveAt < cutoff && s.messages.length > 0) {
          expired.push(s);
        } else {
          kept.push(s);
        }
      }
      if (expired.length > 0) {
        state.history = [...expired, ...state.history].slice(0, 20);
        state.sessions = kept;
        if (state.activeSessionIndex >= state.sessions.length) {
          state.activeSessionIndex = Math.max(0, state.sessions.length - 1);
        }
      }
    },
  },
});

export const {
  setSessions,
  setActiveSessionIndex,
  setDrawerOpen,
  addMessage,
  updateLastMessage,
  addSession,
  removeSession,
  clearSessions,
  setEmail,
  setUsage,
  addToHistory,
  removeFromHistory,
  pruneExpiredSessions,
} = chatSlice.actions;
export default chatSlice.reducer;
