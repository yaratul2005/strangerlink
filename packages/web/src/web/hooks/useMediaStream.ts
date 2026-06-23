import { useCallback, useEffect, useRef, useState } from "react";

type MediaError = "permission_denied" | "no_device" | "in_use" | null;

/**
 * Manages local camera + microphone.
 * For text mode pass enabled=false to skip requesting media.
 */
export function useMediaStream(enabled: boolean) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [error, setError] = useState<MediaError>(null);
  const [loading, setLoading] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setLoading(true);

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = s;
        setStream(s);
        setError(null);
      })
      .catch((err: DOMException) => {
        if (cancelled) return;
        if (err.name === "NotAllowedError") setError("permission_denied");
        else if (err.name === "NotFoundError") setError("no_device");
        else if (err.name === "NotReadableError") setError("in_use");
        else setError("permission_denied");
      })
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setStream(null);
    };
  }, [enabled]);

  const toggleVideo = useCallback(() => {
    const s = streamRef.current;
    if (!s) return;
    const track = s.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setVideoEnabled(track.enabled);
    }
  }, []);

  const toggleAudio = useCallback(() => {
    const s = streamRef.current;
    if (!s) return;
    const track = s.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setAudioEnabled(track.enabled);
    }
  }, []);

  return { stream, videoEnabled, audioEnabled, toggleVideo, toggleAudio, error, loading };
}
