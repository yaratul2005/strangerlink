# StrangerLink — Design System

Dark, electric, anonymous. Black canvas, electric-blue energy, crisp white type. Omegle reborn.

## Color
| Token | Hex | Use |
|---|---|---|
| bg | #000000 | page background |
| surface | #0A0A0F | secondary surfaces, control bar |
| card | #0D1117 | panels, cards, modals |
| accent | #2563EB | primary actions, my message bubbles |
| accent-light | #3B82F6 | hover, gradients |
| glow | #60A5FA | glow rings, highlights |
| white | #FFFFFF | headings |
| white-muted | #E2E8F0 | body |
| white-dim | #94A3B8 | secondary text |
| border | #1E293B | subtle borders |
| danger | #EF4444 | report, stop, errors |
| success | #22C55E | online, connected |

## Typography
- Font: Inter (Google Fonts), system-ui fallback.
- Headings: weight 700–800, letter-spacing -0.02em.
- Body: weight 400, line-height 1.6.
- Hero: up to 64px / clamp on mobile.

## Radii
sm 8px · md 12px · lg 20px · pill 9999px

## Motion
- fast 150ms ease · normal 300ms ease · spring 600ms cubic-bezier(0.16,1,0.32,1)
- Glow shadow: 0 0 24px rgba(37,99,235,.4); lg 0 0 48px rgba(37,99,235,.25)
- Keyframes: fadeIn, fadeInUp, fadeInScale, pulse, spin, shimmer, blink, slideInRight, slideInLeft, bounceIn, glowPulse, sonar
- Use framer-motion for page/component orchestration; staggered reveals on load.
- Particle background on home (canvas, floating blue dots + magnetic cursor).

## Components
- **Button**: variants primary/ghost/danger/outline; sizes sm/md/lg; loading spinner; pill; scale(.97) active; glow on primary hover.
- **Modal**: portal, backdrop blur(8px) rgba(0,0,0,.8), card panel, fadeInScale enter. Full-screen on mobile.
- **Badge**: online/waiting/connected/error with colored dot + optional pulse.

## Layout
- Home: centered hero, 3 feature cards row → single column < 768px.
- Chat: navbar / [video 60% | text chat 40%] / control bar 72px. Mobile: stack video 50vh over chat 50vh, icon-only controls.

## UX
- No account. Age gate (18+) before chat.
- States: idle → queuing → connecting → chatting → disconnected.
- Match celebration flash on connect. Skip/Stop/Report controls. Typing indicator.
