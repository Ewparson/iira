// src/pages/Legal.jsx
import React, { useEffect, useState } from "react";

export default function Legal() {
  const [text, setText] = useState("Loading…");
  const [err, setErr] = useState("");

  useEffect(() => {
    const ctrl = new AbortController();
    const url =
      (process.env.PUBLIC_URL?.replace(/\/$/, "") || "") + "/media/legal.txt";

    fetch(url, { signal: ctrl.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then(setText)
      .catch((e) => {
        if (e.name === "AbortError") return;
        console.error("Failed to load legal.txt:", e);
        setErr("Failed to load legal information.");
      });

    return () => ctrl.abort();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold">Legal</h1>
      <pre className="card p-4 whitespace-pre-wrap">{err || text}</pre>
    </div>
  );
}
