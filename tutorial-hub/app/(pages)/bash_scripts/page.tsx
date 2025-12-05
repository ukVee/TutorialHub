"use client";

import NeuralMesh from "../../components/terminal/NeuralMesh";
import RepoExplorer from "../../features/repo-explorer/RepoExplorer";

export default function BashScriptsPage() {
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-slate-100">
      <NeuralMesh className="pointer-events-none absolute inset-0 opacity-30" />
      <main className="relative z-10 mx-auto flex max-w-6xl flex-col gap-10 px-6 py-14 md:px-10 lg:px-12">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">i3-scripts</p>
          <h1 className="text-3xl font-semibold text-white md:text-4xl">Bash scripts & dotfiles</h1>
          <p className="text-base text-slate-200/85">Browse the repo contents and peek into each file inline.</p>
        </header>

        <section>
          <RepoExplorer />
        </section>
      </main>
    </div>
  );
}
