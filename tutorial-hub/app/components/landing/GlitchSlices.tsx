"use client";

import NeuralMesh from "../terminal/NeuralMesh";
import MockTerminal from "../terminal/MockTerminal";

type Props = {
  active: boolean;
};

export default function GlitchSlices({ active }: Props) {
  if (!active) return null;

  return (
    <div className="glitch-slices" aria-hidden>
      <div className="glitch-slice glitch-slice--diagonal">
        <NeuralMesh />
        <div className="glitch-slice__terminal-content">
          <MockTerminal />
        </div>
        <div className="glitch-label glitch-label--primary">glitch detected</div>
      </div>
    </div>
  );
}
