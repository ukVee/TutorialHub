"use client";

type Props = {
  show: boolean;
};

export default function ApologyMessage({ show }: Props) {
  if (!show) return null;

  return (
    <div className="apology-message">
      <strong className="block text-sm font-semibold">Sorry, you weren’t supposed to see that.</strong>
    </div>
  );
}
