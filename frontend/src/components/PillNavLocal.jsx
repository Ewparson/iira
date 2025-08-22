import React from "react";

export default function PillNavLocal({ items = [], value, onChange }) {
  return (
    <div className="inline-flex rounded-full bg-white/5 p-1 border border-white/10">
      {items.map((label) => {
        const active = label === value;
        return (
          <button
            key={label}
            type="button"
            onClick={() => onChange?.(label)}
            className={
              "px-3.5 py-1.5 text-sm rounded-full transition " +
              (active ? "bg-white text-black" : "text-white/80 hover:text-white")
            }
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
