import React from "react";
export default function StepperLocal({ steps = [], current = 0, onChange }) {
  return (
    <nav aria-label="progress" className="w-full overflow-x-auto">
      <ol className="relative mx-auto flex min-w-max items-center gap-6 px-1 py-3">
        {steps.map((label, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={label} className="relative flex items-center">
              {i !== 0 && (
                <span className={["absolute -left-3 top-1/2 h-[2px] w-6 -translate-y-1/2 rounded",
                  done ? "bg-red-600" : "bg-neutral-800"].join(" ")} />
              )}
              <button type="button" onClick={() => onChange?.(i)} aria-current={active ? "step" : undefined}
                      className="group grid grid-cols-[2rem,auto] items-center gap-3 pr-2 text-left
                                 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600/40 rounded-xl">
                <span className={["grid size-8 place-items-center rounded-full border transition",
                  done ? "border-red-600 text-red-600"
                       : active ? "border-red-600 bg-red-600/10 text-neutral-50"
                                : "border-neutral-700 text-neutral-500"].join(" ")}>
                  {i + 1}
                </span>
                <span className={["whitespace-nowrap text-sm font-medium",
                  done ? "text-neutral-200"
                       : active ? "text-neutral-50"
                                : "text-neutral-400 group-hover:text-neutral-200"].join(" ")}>
                  {label}
                </span>
              </button>
              {i !== steps.length - 1 && (
                <span className={["absolute -right-3 top-1/2 h-[2px] w-6 -translate-y-1/2 rounded",
                  i + 1 <= current ? "bg-red-600" : "bg-neutral-800"].join(" ")} />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
