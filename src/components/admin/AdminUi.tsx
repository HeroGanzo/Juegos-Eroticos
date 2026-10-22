import type { ReactNode } from "react";

export function AdminTitle({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1.5 max-w-3xl text-sm text-zinc-400">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, icon, tone = "brand" }: { label: string; value: ReactNode; icon: ReactNode; tone?: "brand" | "amber" | "sky" | "emerald" }) {
  const tones = {
    brand: "from-brand/25 text-brand",
    amber: "from-amber-500/25 text-amber-300",
    sky: "from-sky-500/25 text-sky-300",
    emerald: "from-emerald-500/25 text-emerald-300",
  };
  return (
    <div className={`rounded-2xl border border-white/10 bg-linear-to-br to-transparent p-5 ${tones[tone]}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">{label}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <p className="mt-3 text-3xl font-black text-white">{value}</p>
    </div>
  );
}
