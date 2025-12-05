"use client";

import type { ApologyMessageProps } from "../../lib/types";

export default function ApologyMessage({ show }: ApologyMessageProps) {
  if (!show) return null;

  return (
    <div className="apology-message">
      <strong className="block text-sm font-semibold">Sorry, you weren’t supposed to see that.</strong>
    </div>
  );
}
