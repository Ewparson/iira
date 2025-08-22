import React from "react";
// FIX: remove missing BeamsBg import
// import BeamsBg from "../components/BeamsBg";
import LightRays from "../components/LightRays";

export default function LabBits() {
  return (
    <div className="relative min-h-[70vh]">
      <div className="pointer-events-none absolute inset-0 z-0">
        <LightRays
  className="h-full w-full"
  raysOrigin="top-center"
  raysColor="#b30000"   // deep red
  raysSpeed={1.2}
  lightSpread={0.9}
  rayLength={1.1}
  followMouse
  mouseInfluence={0.1}
  noiseAmount={0.06}
  distortion={0.04}
        />
      </div>

      <div className="relative z-10 p-6">
        <h1 className="text-2xl font-semibold">Lab Bits</h1>
        {/* page content here */}
      </div>
    </div>
  );
}
