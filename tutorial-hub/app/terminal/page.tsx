"use client";

import NeuralMesh from "../components/terminal/NeuralMesh";
import MockTerminal from "../components/terminal/MockTerminal";

export default function Terminal() {

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#05040b]">
      <NeuralMesh />
      <div className="relative z-10 flex items-center justify-center h-full p-6">
        <MockTerminal />
      </div>
    </div>
  );
}
