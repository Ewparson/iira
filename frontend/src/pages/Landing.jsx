import React, { useState } from "react";

// Inline red light-rays background (no deps)
function LightRaysRed({ className = "" }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 -z-10 ${className}`}>
      <div
        className="absolute inset-0 blur-3xl"
        style={{
          background:
            "radial-gradient(60% 45% at 50% -10%, rgba(239,68,68,.6), rgba(239,68,68,0) 60%)",
          maskImage: "radial-gradient(80% 60% at 50% 0%, black, transparent 70%)",
          WebkitMaskImage: "radial-gradient(80% 60% at 50% 0%, black, transparent 70%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "repeating-conic-gradient(from -15deg at 50% -10%, rgba(239,68,68,.28) 0deg, rgba(239,68,68,0) 6deg 12deg)",
          maskImage: "radial-gradient(85% 70% at 50% 0%, black, transparent 72%)",
          WebkitMaskImage: "radial-gradient(85% 70% at 50% 0%, black, transparent 72%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(10,10,10,0) 0%, rgba(10,10,10,.6) 50%, rgba(10,10,10,1) 100%)",
        }}
      />
      <div
        className="absolute inset-0 mix-blend-screen opacity-10"
        style={{
          backgroundImage:
            "url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22128%22 height=%22128%22 viewBox=%220 0 128 128%22><filter id=%22n%22 x=%220%22 y=%220%22 width=%22100%25%22 height=%22100%25%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%222%22 stitchTiles=%22stitch%22/></filter><rect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22 opacity=%220.65%22/></svg>')",
          backgroundSize: "128px 128px",
        }}
      />
    </div>
  );
}

// ------------------------------
// Minimal brand tokens (tailwind)
// ------------------------------
const brand = {
  bg: "bg-neutral-950",
  panel: "bg-neutral-900/80",
  text: "text-neutral-50",
  subtext: "text-neutral-400",
  line: "bg-neutral-800",
  accent: "bg-red-600",
  accentHover: "hover:bg-red-500",
  ring: "ring-2 ring-red-600/30",
};

// ---------------------------------------
// Segmented control — Individual/Business
// ---------------------------------------
function Segment({ value, current, onChange }) {
  const isActive = value === current;
  return (
    <button
      onClick={() => onChange(value)}
      className={[
        "px-4 py-2 text-sm font-medium rounded-xl border transition",
        isActive
          ? "border-red-600 text-neutral-50 bg-red-600/10"
          : "border-neutral-700 text-neutral-400 hover:text-neutral-200 hover:border-neutral-500",
      ].join(" ")}
    >
      {value}
    </button>
  );
}

// ---------------------------------------
// Email capture (no backend wired yet)
// ---------------------------------------
function EmailCapture({ onSubmit }) {
  const [email, setEmail] = useState("");
  const valid = /.+@.+\..+/.test(email);
  return (
    <div className="w-full max-w-xl">
      <label className="sr-only" htmlFor="email">Email</label>
      <div className="flex gap-3">
        <input
          id="email"
          type="email"
          placeholder="you@domain.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={[
            "flex-1 rounded-xl border bg-neutral-900/70 px-4 py-3 text-neutral-100 placeholder-neutral-500",
            "focus:outline-none focus:ring-2 focus:ring-red-600/40 border-neutral-700",
          ].join(" ")}
        />
        <button
          disabled={!valid}
          onClick={() => valid && onSubmit?.(email)}
          className={[
            "rounded-xl px-5 font-semibold",
            "bg-red-600 text-white disabled:opacity-40 disabled:cursor-not-allowed",
            "hover:bg-red-500 transition-colors",
          ].join(" ")}
        >
          Create Account
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------
// Validation placeholder card
// ---------------------------------------
function ValidationPanel() {
  return (
    <div
      className={["rounded-2xl border", brand.panel, "border-neutral-800 p-6"].join(" ")}
      aria-label="Validation preview"
    >
      <div className="aspect-[4/3] grid place-items-center text-neutral-500">
        <span className="text-sm">[ Validation UI Placeholder ]</span>
      </div>
    </div>
  );
}

// ---------------------------------------
// Landing Page — drop-in replacement
// ---------------------------------------
export default function Landing() {
  const [segment, setSegment] = useState("Individual");

  return (
    <div className={[brand.bg, brand.text, "min-h-dvh w-full relative overflow-hidden"].join(" ")}>
      <LightRaysRed />

      {/* HERO */}
      <section className="mx-auto max-w-7xl px-6 pt-16 pb-10 lg:grid lg:grid-cols-2 lg:gap-16">
        <div className="order-2 lg:order-1">
          <ValidationPanel />
        </div>

        <div className="order-1 lg:order-2 flex flex-col items-start gap-6">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05]">
            Proof of
            <br />
            Intelligent
            <br />
            Compute
          </h1>
          <p className={["max-w-xl text-base sm:text-lg", brand.subtext].join(" ")}>
            Securely mint IntellaCoin by verifying AI work, not wasting power.
          </p>

          <EmailCapture onSubmit={(email) => console.log("create:", email, segment)} />

          <div className="flex items-center gap-2">
            <Segment value="Individual" current={segment} onChange={setSegment} />
            <Segment value="Business" current={segment} onChange={setSegment} />
          </div>
        </div>
      </section>
    </div>
  );
}
