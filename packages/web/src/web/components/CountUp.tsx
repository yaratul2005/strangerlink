import { useEffect, useRef, useState } from "react";

export function CountUp({ to, from = 0, duration = 2000 }: { to: number; from?: number; duration?: number }) {
  const [val, setVal] = useState(from);
  const ref = useRef<number>(0);

  useEffect(() => {
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.floor(from + (to - from) * eased));
      if (p < 1) ref.current = requestAnimationFrame(tick);
    };
    ref.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(ref.current);
  }, [to, from, duration]);

  return <>{val.toLocaleString()}</>;
}

export default CountUp;
