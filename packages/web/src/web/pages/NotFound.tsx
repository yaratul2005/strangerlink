import { Link } from "wouter";
import Button from "../components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-screen grid place-items-center text-center px-6" style={{ background: "var(--sl-bg)" }}>
      <div>
        <h1 className="text-7xl font-extrabold sl-gradient-text">404</h1>
        <p className="text-[var(--sl-white-dim)] mt-3 mb-6">This page wandered off to meet a stranger.</p>
        <Link to="/">
          <Button size="lg">Back Home</Button>
        </Link>
      </div>
    </div>
  );
}
