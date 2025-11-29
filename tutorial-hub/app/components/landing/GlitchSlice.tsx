"use client";

import NeuralMesh from "../terminal/NeuralMesh";
import MockTerminal from "../terminal/MockTerminal";

type GlitchSliceProps = {
  clipPath: string;
  zIndex: number;
  label?: string;
};

export default function GlitchSlice({ clipPath, zIndex, label }: GlitchSliceProps) {
  return (
    <div
      className="glitch-slice"
      style={{ clipPath, zIndex }}
      aria-hidden
    >
      <div className="glitch-slice__bg">
        <NeuralMesh />
      </div>
      <div className="glitch-slice__terminal">
        <MockTerminal />
      </div>
      {label ? <span className="glitch-slice__label">{label}</span> : null}
    </div>
  );
}
