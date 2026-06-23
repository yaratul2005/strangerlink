# StrangerLink Build

## Stack
Managed: Bun + Hono + React 19 + Wouter + Tailwind 4 + framer-motion.
Real-time: standalone Bun WebSocket signaling server (port 4201) for matchmaking + WebRTC relay.
Web only. Deployable.

## Design system
- Bg #000000, surface #0A0A0F, card #0D1117
- Accent #2563EB / light #3B82F6 / glow #60A5FA
- White #FFF / muted #E2E8F0 / dim #94A3B8
- Border #1E293B, danger #EF4444, success #22C55E
- Inter font, glow/pulse animations

## Tasks
- [x] Scaffold app_init
- [ ] design.md
- [ ] Install framer-motion, lucide-react (present)
- [ ] globals styles (CSS vars + keyframes) in styles.css
- [ ] UI primitives: Button, Modal, Badge
- [ ] Home page (navbar, hero, feature cards, footer, particle bg)
- [ ] Standalone WS signaling server: matchmaking + WebRTC relay + chat relay + typing
- [ ] Hooks: useSignal (WS), useMediaStream, useWebRTC, useMatchmaking
- [ ] ChatContext (reducer)
- [ ] Chat page: video panel, text chat, control bar
- [ ] Modals: Connect, Waiting, Disconnect, Report
- [ ] Animations: MatchCelebration, typing indicator, ripples
- [ ] API: report endpoint + health (Hono)
- [ ] Report table (drizzle)
- [ ] Wire dev script to run both servers
- [ ] build passes
- [ ] deliver

## STATUS: COMPLETE — all phases built & verified. Build clean. Match+msg+report tested.

## Notes
- Production server.ts must also boot the WS server.
- WS url from VITE_SIGNAL_URL, fallback derive from window.location.
