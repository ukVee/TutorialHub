import SplashGate from "./components/splash/SplashGate";
import NeuralMesh from "./components/NeuralMesh";
import MockTerminal from "./components/MockTerminal";

export default function Home() {
  return (
    <SplashGate>
      <div className="relative w-full h-screen overflow-hidden bg-[#05040b]">
        <NeuralMesh />
        <div className="relative z-10 flex items-center justify-center h-full p-6">
          <MockTerminal />
        </div>
      </div>
    </SplashGate>
  );
}
