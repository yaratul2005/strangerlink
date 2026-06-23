import { useEffect, useRef, useState } from "react";
import type { SignalApi } from "./useSignal";

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

// Optional TURN from env
const turnUrl = import.meta.env.VITE_TURN_URL as string | undefined;
if (turnUrl) {
  ICE_SERVERS.push({
    urls: turnUrl,
    username: import.meta.env.VITE_TURN_USERNAME as string,
    credential: import.meta.env.VITE_TURN_CREDENTIAL as string,
  });
}

interface Params {
  localStream: MediaStream | null;
  signal: SignalApi;
  isInitiator: boolean;
  roomId: string | null;
  active: boolean; // only run when in a video chat
}

/**
 * Manages the RTCPeerConnection lifecycle and relays signaling over the WS.
 */
export function useWebRTC({ localStream, signal, isInitiator, roomId, active }: Params) {
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>("new");
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const pendingIce = useRef<RTCIceCandidateInit[]>([]);

  useEffect(() => {
    if (!active || !roomId) return;

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcRef.current = pc;
    const remote = new MediaStream();
    setRemoteStream(remote);

    // Add local tracks
    if (localStream) {
      localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));
    }

    pc.ontrack = (e) => {
      e.streams[0]?.getTracks().forEach((t) => remote.addTrack(t));
    };
    pc.onicecandidate = (e) => {
      if (e.candidate) signal.emit("webrtc_ice", { candidate: e.candidate });
    };
    pc.onconnectionstatechange = () => setConnectionState(pc.connectionState);

    const offSdpOffer = signal.on("webrtc_offer", async ({ offer }) => {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      for (const c of pendingIce.current) await pc.addIceCandidate(c);
      pendingIce.current = [];
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      signal.emit("webrtc_answer", { answer });
    });

    const offSdpAnswer = signal.on("webrtc_answer", async ({ answer }) => {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
      for (const c of pendingIce.current) await pc.addIceCandidate(c);
      pendingIce.current = [];
    });

    const offIce = signal.on("webrtc_ice", async ({ candidate }) => {
      if (!candidate) return;
      if (pc.remoteDescription && pc.remoteDescription.type) {
        await pc.addIceCandidate(candidate).catch(() => {});
      } else {
        pendingIce.current.push(candidate);
      }
    });

    if (isInitiator) {
      (async () => {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        signal.emit("webrtc_offer", { offer });
      })();
    }

    return () => {
      offSdpOffer();
      offSdpAnswer();
      offIce();
      pc.getSenders().forEach((s) => s.track?.stop?.());
      pc.close();
      pcRef.current = null;
      setRemoteStream(null);
      setConnectionState("new");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, roomId, isInitiator]);

  return { remoteStream, connectionState };
}
