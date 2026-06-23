import { createContext, useContext, useEffect, useReducer, useRef, type ReactNode } from "react";
import { useSignal, type SignalApi } from "../hooks/useSignal";

export type Mode = "video" | "text";
export type MatchState = "idle" | "queuing" | "connecting" | "chatting" | "disconnected";
export type DisconnectReason = "stranger_left" | "you_left" | "error";

export interface Message {
  id: string;
  text: string;
  sender: "me" | "stranger";
  timestamp: number;
}

interface State {
  mode: Mode;
  matchState: MatchState;
  roomId: string | null;
  isInitiator: boolean;
  messages: Message[];
  strangerIsTyping: boolean;
  interests: string[];
  language: string;
  disconnectReason: DisconnectReason;
  cooldownSeconds: number;
  onlineCount: number;
  celebrate: boolean;
}

type Action =
  | { type: "SET_MODE"; mode: Mode }
  | { type: "SET_PREFS"; interests: string[]; language: string }
  | { type: "JOIN_QUEUE" }
  | { type: "MATCH_FOUND"; roomId: string; isInitiator: boolean; mode: Mode }
  | { type: "CELEBRATE_DONE" }
  | { type: "ADD_MESSAGE"; message: Message }
  | { type: "SET_TYPING"; typing: boolean }
  | { type: "STRANGER_DISCONNECTED"; reason: DisconnectReason }
  | { type: "RESET" }
  | { type: "COOLDOWN"; seconds: number }
  | { type: "SET_ONLINE"; count: number };

const initialState: State = {
  mode: "video",
  matchState: "idle",
  roomId: null,
  isInitiator: false,
  messages: [],
  strangerIsTyping: false,
  interests: [],
  language: "en",
  disconnectReason: "stranger_left",
  cooldownSeconds: 0,
  onlineCount: 12847,
  celebrate: false,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_MODE":
      return { ...state, mode: action.mode };
    case "SET_PREFS":
      return { ...state, interests: action.interests, language: action.language };
    case "JOIN_QUEUE":
      return { ...state, matchState: "queuing", messages: [], strangerIsTyping: false, roomId: null };
    case "MATCH_FOUND":
      return {
        ...state,
        matchState: "chatting",
        roomId: action.roomId,
        isInitiator: action.isInitiator,
        mode: action.mode,
        celebrate: true,
        messages: [],
      };
    case "CELEBRATE_DONE":
      return { ...state, celebrate: false };
    case "ADD_MESSAGE":
      return { ...state, messages: [...state.messages, action.message] };
    case "SET_TYPING":
      return { ...state, strangerIsTyping: action.typing };
    case "STRANGER_DISCONNECTED":
      return { ...state, matchState: "disconnected", disconnectReason: action.reason, roomId: null, strangerIsTyping: false };
    case "RESET":
      return { ...state, matchState: "idle", roomId: null, messages: [], strangerIsTyping: false };
    case "COOLDOWN":
      return { ...state, matchState: "idle", cooldownSeconds: action.seconds };
    case "SET_ONLINE":
      return { ...state, onlineCount: action.count };
    default:
      return state;
  }
}

interface ChatContextValue {
  state: State;
  signal: SignalApi;
  setMode: (mode: Mode) => void;
  setPrefs: (interests: string[], language: string) => void;
  joinQueue: () => void;
  leaveQueue: () => void;
  sendMessage: (text: string) => void;
  skipStranger: () => void;
  stopChat: () => void;
  startTyping: () => void;
  stopTyping: () => void;
  submitReport: (reason: string, details: string) => void;
  dismissCelebration: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const signal = useSignal();
  const stateRef = useRef(state);
  stateRef.current = state;

  // Wire signal events
  useEffect(() => {
    const offs = [
      signal.on("connected", (p) => p?.online && dispatch({ type: "SET_ONLINE", count: Math.max(p.online, 1) })),
      signal.on("match_found", (p) =>
        dispatch({ type: "MATCH_FOUND", roomId: p.roomId, isInitiator: p.initiator, mode: p.mode }),
      ),
      signal.on("stranger_message", (p) =>
        dispatch({ type: "ADD_MESSAGE", message: { id: uid(), text: p.text, sender: "stranger", timestamp: p.timestamp } }),
      ),
      signal.on("stranger_typing", () => dispatch({ type: "SET_TYPING", typing: true })),
      signal.on("stranger_stopped_typing", () => dispatch({ type: "SET_TYPING", typing: false })),
      signal.on("stranger_disconnected", (p) =>
        dispatch({ type: "STRANGER_DISCONNECTED", reason: p?.reason ?? "stranger_left" }),
      ),
      signal.on("cooldown", (p) => dispatch({ type: "COOLDOWN", seconds: p?.seconds ?? 30 })),
    ];
    return () => offs.forEach((f) => f());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value: ChatContextValue = {
    state,
    signal,
    setMode: (mode) => dispatch({ type: "SET_MODE", mode }),
    setPrefs: (interests, language) => dispatch({ type: "SET_PREFS", interests, language }),
    joinQueue: () => {
      dispatch({ type: "JOIN_QUEUE" });
      signal.emit("join_queue", {
        mode: stateRef.current.mode,
        interests: stateRef.current.interests,
        language: stateRef.current.language,
      });
    },
    leaveQueue: () => {
      signal.emit("leave_queue");
      dispatch({ type: "RESET" });
    },
    sendMessage: (text) => {
      if (!text.trim()) return;
      signal.emit("send_message", { text, timestamp: Date.now() });
      dispatch({ type: "ADD_MESSAGE", message: { id: uid(), text, sender: "me", timestamp: Date.now() } });
    },
    skipStranger: () => {
      signal.emit("skip_stranger");
      dispatch({ type: "JOIN_QUEUE" });
    },
    stopChat: () => {
      signal.emit("disconnect_chat");
      dispatch({ type: "RESET" });
    },
    startTyping: () => signal.emit("typing_start"),
    stopTyping: () => signal.emit("typing_stop"),
    submitReport: (reason, details) => signal.emit("submit_report", { reason, details }),
    dismissCelebration: () => dispatch({ type: "CELEBRATE_DONE" }),
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}
