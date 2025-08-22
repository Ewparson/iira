import React from "react";

export default function Logo({ size = 28 }) {
  return (
    <div className="flex items-center gap-2 select-none">
      {/* SVG keeps its aspect ratio and never stretches */}
      <svg
        className="shrink-0"
        style={{ height: size, width: "auto" }}
        viewBox="0 0 64 32"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="iiraRed" x1="0" x2="1">
            <stop offset="0" stopColor="#ff3b3b" />
            <stop offset="1" stopColor="#d32222" />
          </linearGradient>
        </defs>
        <path
          d="M7 26L18 6h6l-9 16h14L41 6h6L33 26H7z"
          fill="url(#iiraRed)"
        />
      </svg>
      <span className="text-white/90 font-semibold tracking-wide text-lg">
        IIRA
      </span>
    </div>
  );
}
