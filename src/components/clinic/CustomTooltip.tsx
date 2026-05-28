export default function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-black/80 backdrop-blur-md px-3 py-2 shadow-xl">
      {label && <p className="text-white/60 text-xs mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="text-xs font-medium" style={{ color: p.color }}>
          {p.name}: {p.value.toLocaleString("ru-RU")}
        </p>
      ))}
    </div>
  );
}
