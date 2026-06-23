import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";

export function MatchCelebration({ show, onDone }: { show: boolean; onDone: () => void }) {
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(onDone, 1100);
    return () => clearTimeout(t);
  }, [show, onDone]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[200] grid place-items-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            background: "radial-gradient(circle at center, rgba(37,99,235,0.16), rgba(37,99,235,0) 60%)",
          }}
        >
          {[0, 1, 2, 3].map((i) => (
            <motion.span
              key={i}
              className="absolute rounded-full"
              style={{ width: 160, height: 160, border: "2px solid rgba(96,165,250,0.6)" }}
              initial={{ scale: 1, opacity: 0.9 }}
              animate={{ scale: 2.6, opacity: 0 }}
              transition={{ duration: 1, delay: i * 0.1, ease: "easeOut" }}
            />
          ))}
          <motion.h2
            className="text-4xl sm:text-5xl font-extrabold text-white"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 14 }}
            style={{ textShadow: "0 0 30px rgba(37,99,235,0.8)" }}
          >
            Stranger Found!
          </motion.h2>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default MatchCelebration;
