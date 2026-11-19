import React from 'react';
import { Star, User, Shield, Calendar, Sparkles } from 'lucide-react';
import { getRatingBadge } from '../../types/performance';

interface ScoreMeterGaugeProps {
  score: number;
  evaluatorName?: string;
  evaluatorRole?: string;
  evaluatedAt?: string;
  onRateClick?: () => void;
  canRate?: boolean;
}

export const ScoreMeterGauge: React.FC<ScoreMeterGaugeProps> = ({
  score = 0,
  evaluatorName,
  evaluatorRole,
  evaluatedAt,
  onRateClick,
  canRate = true,
}) => {
  const badge = getRatingBadge(score);

  // Gauge geometry: Semi-circle from -180 deg (left) to 0 deg (right)
  // Normalized score: 0 to 5 -> 0% to 100% -> -90 deg to +90 deg
  const clampedScore = Math.min(Math.max(score, 0), 5);
  const needleAngle = -90 + (clampedScore / 5) * 180;

  // Star fill count
  const filledStars = Math.round(clampedScore);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col items-center text-center space-y-4">
      {/* Title */}
      <div className="w-full text-center">
        <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
          OVERALL SCORE METER
        </span>
      </div>

      {/* SVG Semi-Circle Speedometer */}
      <div className="relative w-48 h-28 flex items-center justify-center">
        <svg viewBox="0 0 200 120" className="w-full h-full overflow-visible">
          {/* Gauge Arc Segments: 5 bands from left (180°) to right (0°) */}
          {/* Arc path helper: Center at (100, 105), Radius 75 */}
          {/* 1. Red Band: 0 to 1.0 (180° to 144°) */}
          <path
            d="M 25 105 A 75 75 0 0 1 39.3 60.9"
            fill="none"
            stroke="#ef4444"
            strokeWidth="14"
            strokeLinecap="round"
          />
          {/* 2. Orange Band: 1.0 to 2.0 (144° to 108°) */}
          <path
            d="M 39.3 60.9 A 75 75 0 0 1 76.8 33.7"
            fill="none"
            stroke="#f97316"
            strokeWidth="14"
          />
          {/* 3. Yellow Band: 2.0 to 3.0 (108° to 72°) */}
          <path
            d="M 76.8 33.7 A 75 75 0 0 1 123.2 33.7"
            fill="none"
            stroke="#eab308"
            strokeWidth="14"
          />
          {/* 4. Light Green Band: 3.0 to 4.0 (72° to 36°) */}
          <path
            d="M 123.2 33.7 A 75 75 0 0 1 160.7 60.9"
            fill="none"
            stroke="#22c55e"
            strokeWidth="14"
          />
          {/* 5. Emerald Band: 4.0 to 5.0 (36° to 0°) */}
          <path
            d="M 160.7 60.9 A 75 75 0 0 1 175 105"
            fill="none"
            stroke="#10b981"
            strokeWidth="14"
            strokeLinecap="round"
          />

          {/* Numbers along the arc */}
          <text x="20" y="115" fontSize="10" fill="#64748b" fontWeight="bold">0.0</text>
          <text x="32" y="52" fontSize="10" fill="#64748b" fontWeight="bold">1.0</text>
          <text x="70" y="24" fontSize="10" fill="#64748b" fontWeight="bold">2.0</text>
          <text x="122" y="24" fontSize="10" fill="#64748b" fontWeight="bold">3.0</text>
          <text x="160" y="52" fontSize="10" fill="#64748b" fontWeight="bold">4.0</text>
          <text x="175" y="115" fontSize="10" fill="#64748b" fontWeight="bold">5.0</text>

          {/* Center Needle */}
          <g transform={`rotate(${needleAngle}, 100, 105)`} style={{ transition: 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
            <line
              x1="100"
              y1="105"
              x2="100"
              y2="42"
              stroke="#0f172a"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            {/* Needle Pointer tip */}
            <circle cx="100" cy="40" r="3.5" fill="#2563eb" />
          </g>

          {/* Pivot Circle */}
          <circle cx="100" cy="105" r="7" fill="#0f172a" />
          <circle cx="100" cy="105" r="3" fill="#ffffff" />
        </svg>
      </div>

      {/* Numerical Score Display */}
      <div className="space-y-1">
        <span className="text-4xl font-black text-slate-900 tracking-tight block">
          {score.toFixed(1)}
        </span>

        {/* 5-Star Row */}
        <div className="flex items-center justify-center space-x-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${
                i <= filledStars
                  ? 'text-amber-400 fill-amber-400'
                  : 'text-slate-200 fill-slate-100'
              }`}
            />
          ))}
        </div>

        {/* Rating Badge */}
        <div className="pt-1">
          <span
            className={`inline-block px-3 py-0.5 rounded-full text-xs font-bold border ${badge.colorClass}`}
          >
            {badge.label}
          </span>
        </div>

        <p className="text-[10px] text-slate-400 pt-1">
          Overall Average Score<br />
          (Average of 9 dimensions)
        </p>
      </div>

      {/* Evaluator Card Below Meter */}
      <div className="w-full bg-slate-50/80 rounded-xl p-3 border border-slate-200/80 text-left text-[11px] space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-slate-500 flex items-center gap-1.5 font-medium">
            <User className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            Evaluator:
          </span>
          <span className="font-bold text-slate-800 text-right truncate max-w-[130px]">
            {evaluatorName || 'Not Yet Rated'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-500 flex items-center gap-1.5 font-medium">
            <Shield className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            Role:
          </span>
          <span className="font-bold text-slate-800 uppercase text-[10px]">
            {evaluatorRole || 'NONE'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-500 flex items-center gap-1.5 font-medium">
            <Calendar className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            Date:
          </span>
          <span className="font-bold text-slate-800">
            {evaluatedAt
              ? new Date(evaluatedAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })
              : 'Pending'}
          </span>
        </div>
      </div>

      {/* Action Button: Rate Employee Now */}
      {canRate && onRateClick && (
        <button
          onClick={onRateClick}
          className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:shadow-lg active:scale-98"
        >
          <Star className="w-3.5 h-3.5 fill-white text-white" />
          <span>Rate Employee Now</span>
        </button>
      )}
    </div>
  );
};

export default ScoreMeterGauge;
