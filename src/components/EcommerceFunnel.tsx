"use client";

interface FunnelStage {
  label: string;
  value: number;
}

interface EcommerceFunnelProps {
  stages: FunnelStage[];
  insights?: string[];
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export default function EcommerceFunnel({ stages, insights }: EcommerceFunnelProps) {
  if (!stages.length || stages[0].value === 0) return null;

  const max = stages[0].value;
  const drops = stages.slice(1).map((s, i) => {
    const prev = stages[i].value;
    const drop = prev > 0 ? ((prev - s.value) / prev) * 100 : 0;
    return { drop, from: prev, to: s.value };
  });
  const maxDropIdx = drops.reduce((mi, d, i) => (d.drop > drops[mi].drop ? i : mi), 0);

  return (
    <div>
      {/* Funnel bars */}
      <div className="flex items-end gap-0">
        {stages.map((stage, i) => {
          const pct = (stage.value / max) * 100;
          const ofTotal = ((stage.value / max) * 100).toFixed(1);
          const isFirst = i === 0;
          const isLast = i === stages.length - 1;

          return (
            <div key={stage.label} className="flex items-end flex-1 min-w-0">
              {/* Stage column */}
              <div className="flex-1 flex flex-col items-center min-w-0">
                {/* Label */}
                <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 truncate w-full text-center">
                  {stage.label}
                </div>

                {/* Bar */}
                <div className="w-full flex flex-col items-center">
                  <div
                    className={`w-full rounded-t-lg transition-all duration-500 ${
                      isLast ? "bg-[#3bd6ff]" : "bg-[#3bd6ff]/20"
                    }`}
                    style={{
                      height: `${Math.max(pct * 1.6, 12)}px`,
                      borderLeft: isFirst ? "none" : "2px solid rgba(59,214,255,0.3)",
                      borderRight: isLast ? "none" : "2px solid rgba(59,214,255,0.3)",
                    }}
                  />
                  {/* Bottom line */}
                  <div className="w-full h-[2px] bg-[#3bd6ff]/40" />
                </div>

                {/* Value */}
                <div className="mt-2 text-center">
                  <span className="text-lg font-bold text-gray-900">{formatNumber(stage.value)}</span>
                  <div className="text-[10px] text-gray-400">
                    ({isFirst ? "100%" : `${ofTotal}%`})
                  </div>
                </div>
              </div>

              {/* Drop indicator between stages */}
              {!isLast && drops[i] && (
                <div className="flex flex-col items-center px-1 -mb-1" style={{ minWidth: "60px" }}>
                  <div className={`text-[11px] font-bold whitespace-nowrap ${
                    i === maxDropIdx ? "text-red-500" : "text-gray-400"
                  }`}>
                    {drops[i].drop.toFixed(1)}% drop
                  </div>
                  {i === maxDropIdx && (
                    <div className="text-[9px] font-bold text-red-400 uppercase tracking-wider mt-0.5">
                      Primary leak
                    </div>
                  )}
                  {/* Arrow */}
                  <svg className={`w-4 h-4 mt-0.5 ${i === maxDropIdx ? "text-red-400" : "text-gray-300"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Conversion rate summary */}
      <div className="flex items-center gap-6 mt-6 pt-4 border-t border-gray-100">
        <div>
          <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Cart-to-Purchase</span>
          <div className="text-xl font-bold text-gray-900">
            {(() => {
              const atc = stages.find(s => s.label === "Add to Cart");
              const purchase = stages[stages.length - 1];
              return atc && atc.value > 0
                ? `${((purchase.value / atc.value) * 100).toFixed(1)}%`
                : "—";
            })()}
          </div>
        </div>
        <div>
          <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Ecommerce CVR</span>
          <div className="text-xl font-bold text-[#3bd6ff]">
            {(() => {
              const ecomm = stages.find(s => s.label === "Ecommerce Sessions");
              const purchase = stages[stages.length - 1];
              const base = ecomm?.value ?? max;
              return base > 0 ? `${((purchase.value / base) * 100).toFixed(2)}%` : "—";
            })()}
          </div>
        </div>
        <div>
          <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Biggest Leak</span>
          <div className="text-xl font-bold text-red-500">
            {stages[maxDropIdx].label} → {stages[maxDropIdx + 1].label}
          </div>
        </div>
      </div>

      {/* AI Insights */}
      {insights && insights.length > 0 && (
        <div className="mt-6 space-y-3">
          <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
            Key Observations
          </h4>
          {insights.map((insight, i) => (
            <div
              key={i}
              className="flex gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100"
            >
              <div className="w-5 h-5 rounded-full bg-[#3bd6ff]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-[#3bd6ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <p className="text-[13px] text-gray-600 leading-relaxed">{insight}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
