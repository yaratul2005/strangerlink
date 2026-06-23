import { motion } from "framer-motion";
import { Globe, MessageSquare, Shield, Video, Zap } from "lucide-react";
import { Link, useLocation } from "wouter";
import Button from "../components/ui/Button";
import CountUp from "../components/CountUp";
import ParticleBackground from "../components/ParticleBackground";
import { useChat } from "../context/ChatContext";

const features = [
  { icon: Shield, title: "Safe & Anonymous", desc: "No accounts, no data stored. Just you and a stranger." },
  { icon: Zap, title: "Instant Matching", desc: "Connected to someone new in under 2 seconds." },
  { icon: Globe, title: "Worldwide", desc: "150+ countries, multiple languages, endless conversations." },
];

export default function Home() {
  const [, navigate] = useLocation();
  const { state, setMode } = useChat();

  const go = (mode: "video" | "text") => {
    setMode(mode);
    navigate(`/chat?mode=${mode}`);
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden" style={{ background: "var(--sl-bg)" }}>
      <ParticleBackground />

      {/* Navbar */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="flex items-center justify-between px-6 sm:px-10 py-5 max-w-7xl mx-auto"
      >
        <Link to="/" className="flex items-center gap-2">
          <span
            className="grid place-items-center rounded-xl"
            style={{ width: 36, height: 36, background: "rgba(37,99,235,0.16)", boxShadow: "var(--sl-shadow-glow)" }}
          >
            <Zap size={20} color="#60a5fa" fill="#60a5fa" />
          </span>
          <span className="text-xl font-extrabold sl-logo-text tracking-tight">StrangerLink</span>
        </Link>
        <Button onClick={() => go("video")}>Start Chatting</Button>
      </motion.nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 text-center pt-16 sm:pt-24 pb-16">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="font-extrabold text-white leading-[1.05]"
          style={{ fontSize: "clamp(40px, 8vw, 64px)", letterSpacing: "-0.02em" }}
        >
          Meet Someone New.
          <br />
          <span className="sl-gradient-text">Right Now, Anywhere.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.6 }}
          className="text-lg text-[var(--sl-white-dim)] mt-6 max-w-xl mx-auto"
        >
          Instant video and text chat with strangers worldwide. No account needed.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-9"
        >
          <Button size="lg" icon={<Video size={20} />} onClick={() => go("video")}>
            Start Video Chat
          </Button>
          <Button size="lg" variant="outline" icon={<MessageSquare size={20} />} onClick={() => go("text")}>
            Start Text Chat
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="flex items-center justify-center gap-2 mt-8 text-sm text-[var(--sl-white-dim)]"
        >
          <span className="relative grid place-items-center" style={{ width: 9, height: 9 }}>
            <span className="absolute inset-0 rounded-full" style={{ background: "#22c55e", animation: "sl-sonar 1.8s ease-out infinite" }} />
            <span className="rounded-full" style={{ width: 9, height: 9, background: "#22c55e" }} />
          </span>
          <span className="text-[var(--sl-glow)] font-semibold sl-mono">
            <CountUp to={state.onlineCount} from={10000} />
          </span>
          people online right now
        </motion.div>
      </section>

      {/* Feature cards */}
      <section className="max-w-5xl mx-auto px-6 pb-20 grid grid-cols-1 md:grid-cols-3 gap-5">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 + i * 0.15, duration: 0.5 }}
            className="sl-feature-card p-6 rounded-[20px]"
            style={{ background: "var(--sl-card)", border: "1px solid var(--sl-border)", transition: "var(--sl-t-normal)" }}
          >
            <span
              className="grid place-items-center rounded-xl mb-4"
              style={{ width: 44, height: 44, background: "rgba(37,99,235,0.14)" }}
            >
              <f.icon size={22} color="#60a5fa" />
            </span>
            <h3 className="text-white font-bold text-lg mb-1.5">{f.title}</h3>
            <p className="text-sm text-[var(--sl-white-dim)] leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </section>

      {/* Footer */}
      <footer className="text-center py-8 text-sm text-[var(--sl-white-dim)] border-t" style={{ borderColor: "var(--sl-border)" }}>
        © 2026 StrangerLink · Terms · Privacy
      </footer>

      <style>{`
        .sl-feature-card:hover { border-color: var(--sl-accent) !important; box-shadow: var(--sl-shadow-glow); transform: translateY(-4px); }
      `}</style>
    </div>
  );
}
