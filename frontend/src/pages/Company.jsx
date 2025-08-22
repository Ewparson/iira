import React from "react";

export default function Company() {
  return (
    <div className="p-8 max-w-5xl mx-auto text-text">
      <h1 className="text-4xl font-bold mb-6">Our Company</h1>
      <p className="text-lg opacity-80">
        This page is a placeholder for company information.
        You can describe your mission, team, philosophy, or investor roadmap here.
      </p>

      <div className="mt-8 space-y-4">
        <p>
          <strong>Project:</strong> IntellaCoin (PoIC Protocol)
        </p>
        <p>
          <strong>Founded:</strong> 2025
        </p>
        <p>
          <strong>Location:</strong> Remote-first / Decentralized infrastructure
        </p>
        <p>
          <strong>Mission:</strong> To decentralize AI validation and enable intelligent compute to power new economic systems.
        </p>
      </div>
    </div>
  );
}
