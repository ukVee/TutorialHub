"use client";

import NeuralMesh from "../components/terminal/NeuralMesh";
import MockTerminal from "../components/terminal/MockTerminal";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function Terminal() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams?.get("forced") !== "1") return;

    const timer = window.setTimeout(() => {
      router.push("/?glitch=1");
    }, 2000);

    return () => window.clearTimeout(timer);
  }, [router, searchParams]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#05040b]">
      <NeuralMesh />
      <div className="relative z-10 flex items-center justify-center h-full p-6">
        <MockTerminal />
      </div>
    </div>
  );
}
