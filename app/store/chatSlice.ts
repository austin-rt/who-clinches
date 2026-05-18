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
}

interface ChatState {
  sessions: ChatSession[];
  activeSessionIndex: number;
  drawerOpen: boolean;
}

const initialState: ChatState = {
  sessions: [],
  activeSessionIndex: 0,
  drawerOpen: true,
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
} = chatSlice.actions;
export default chatSlice.reducer;
