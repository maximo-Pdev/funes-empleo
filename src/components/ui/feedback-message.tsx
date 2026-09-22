import type { ReactNode } from "react";

export function FeedbackMessage({ tone, children }: { tone: "info" | "success" | "error"; children: ReactNode }) {
  const colors = {
    info: "border-blue-300 bg-blue-50 text-blue-950",
    success: "border-green-300 bg-green-50 text-green-950",
    error: "border-red-300 bg-red-50 text-red-950",
  } as const;
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`rounded-md border p-4 ${colors[tone]}`}>
      {children}
    </div>
  );
}
