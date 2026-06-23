import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useChat, type Mode } from "../context/ChatContext";
import { useMediaStream } from "../hooks/useMediaStream";
import { useWebRTC } from "../hooks/useWebRTC";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import VideoPanel from "../components/chat/VideoPanel";
import TextChat from "../components/chat/TextChat";
import ControlBar from "../components/chat/ControlBar";
import MatchCelebration from "../components/chat/MatchCelebration";
import AgeGate, { isAgeConfirmed } from "../components/AgeGate";
import ConnectModal from "../components/modals/ConnectModal";
import WaitingModal from "../components/modals/WaitingModal";
import DisconnectModal from "../components/modals/DisconnectModal";
import ReportModal from "../components/modals/ReportModal";

export default function Chat() {
  const [, navigate] = useLocation();
  const chat = useChat();
  const { state } = chat;

  const [aged, setAged] = useState(isAgeConfirmed());
  const [showConnect, setShowConnect] = useState(false);
  const [showReport, setShowReport] = useState(false);

  // Determine mode from URL once
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const m = (params.get("mode") as Mode) || "video";
    chat.setMode(m);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Show connect modal when idle and aged
  useEffect(() => {
    if (aged && state.matchState === "idle") setShowConnect(true);
  }, [aged, state.matchState]);

  const isVideo = state.mode === "video";
  const media = useMediaStream(isVideo && aged && state.matchState !== "idle");
  const { remoteStream } = useWebRTC({
    localStream: media.stream,
    signal: chat.signal,
    isInitiator: state.isInitiator,
    roomId: state.roomId,
    active: isVideo && state.matchState === "chatting",
  });

  const handleStart = (interests: string[], language: string) => {
    chat.setPrefs(interests, language);
    setShowConnect(false);
    chat.joinQueue();
  };

  const chatting = state.matchState === "chatting";

  if (!aged) return <AgeGate onConfirm={() => setAged(true)} />;

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: "var(--sl-bg)" }}>
      <MatchCelebration show={state.celebrate} onDone={chat.dismissCelebration} />

      {/* Navbar */}
      <nav
        className="flex items-center justify-between px-4 sm:px-6 shrink-0"
        style={{ height: 60, borderBottom: "1px solid var(--sl-border)" }}
      >
        <Link to="/" className="flex items-center gap-2">
          <Zap size={20} color="#60a5fa" fill="#60a5fa" />
          <span className="font-extrabold sl-logo-text hidden sm:block">StrangerLink</span>
        </Link>
        <div className="flex items-center gap-3">
          {chatting ? (
            <Badge variant="connected">You're chatting with a stranger</Badge>
          ) : state.matchState === "queuing" ? (
            <Badge variant="waiting" pulse>Searching…</Badge>
          ) : (
            <Badge variant={chat.signal.connected ? "online" : "error"}>
              {chat.signal.connected ? "Online" : "Offline"}
            </Badge>
          )}
        </div>
        <Button size="sm" variant="outline" onClick={() => navigate("/")}>
          Home
        </Button>
      </nav>

      {/* Reconnecting banner */}
      {chat.signal.reconnecting && (
        <div className="text-center text-xs py-1.5 text-white" style={{ background: "var(--sl-accent)" }}>
          Reconnecting…
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {isVideo && (
          <div className="md:w-[60%] h-[50%] md:h-full">
            <VideoPanel
              localStream={media.stream}
              remoteStream={remoteStream}
              videoEnabled={media.videoEnabled}
              connecting={state.matchState === "queuing"}
            />
          </div>
        )}
        <div className={isVideo ? "md:w-[40%] h-[50%] md:h-full" : "w-full h-full"}>
          <TextChat
            messages={state.messages}
            strangerTyping={state.strangerIsTyping}
            disabled={!chatting}
            onSend={chat.sendMessage}
            onTyping={chat.startTyping}
            onStopTyping={chat.stopTyping}
          />
        </div>
      </div>

      {/* Control bar */}
      <div className="shrink-0">
        <ControlBar
          mode={state.mode}
          audioEnabled={media.audioEnabled}
          videoEnabled={media.videoEnabled}
          onToggleAudio={media.toggleAudio}
          onToggleVideo={media.toggleVideo}
          onSkip={chat.skipStranger}
          onStop={() => chat.stopChat()}
          onReport={() => setShowReport(true)}
          disabled={!chatting}
        />
      </div>

      {/* Permission error overlay */}
      {isVideo && media.error && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full text-sm text-white" style={{ background: "var(--sl-danger)" }}>
          {media.error === "permission_denied"
            ? "Camera/mic blocked — enable permissions to video chat"
            : media.error === "no_device"
              ? "No camera or mic found"
              : "Camera is in use by another app"}
        </div>
      )}

      {/* Modals */}
      <ConnectModal
        isOpen={showConnect}
        mode={state.mode}
        onClose={() => navigate("/")}
        onStart={handleStart}
      />
      <WaitingModal
        isOpen={state.matchState === "queuing"}
        onlineCount={state.onlineCount}
        onCancel={() => {
          chat.leaveQueue();
          navigate("/");
        }}
      />
      <DisconnectModal
        isOpen={state.matchState === "disconnected"}
        reason={state.disconnectReason}
        onNewStranger={() => chat.joinQueue()}
        onStop={() => navigate("/")}
      />
      <ReportModal isOpen={showReport} onClose={() => setShowReport(false)} onSubmit={chat.submitReport} />
    </div>
  );
}
