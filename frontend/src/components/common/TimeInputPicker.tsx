import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { useTimeFormat, TimeFormat } from '../../utils/timeFormat';

interface TimeInputPickerProps {
  value: string; // e.g. "09:30", "14:15", "18:00" (stored in standard 24h HH:mm format)
  onChange: (newValue: string) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
  force12Hour?: boolean;
}

export const TimeInputPicker: React.FC<TimeInputPickerProps> = ({
  value,
  onChange,
  label,
  disabled = false,
  className = '',
  force12Hour,
}) => {
  const { timeFormat } = useTimeFormat();
  const effectiveFormat: TimeFormat = force12Hour ? '12h' : timeFormat;

  // Parse incoming value "HH:mm"
  const parseValue = (timeStr: string) => {
    if (!timeStr || !timeStr.includes(':')) {
      return { hours: 9, minutes: 0 };
    }
    const [h, m] = timeStr.split(':').map((x) => parseInt(x, 10));
    return {
      hours: isNaN(h) ? 9 : Math.min(23, Math.max(0, h)),
      minutes: isNaN(m) ? 0 : Math.min(59, Math.max(0, m)),
    };
  };

  const initial = parseValue(value);
  const [internalHours24, setInternalHours24] = useState<number>(initial.hours);
  const [internalMinutes, setInternalMinutes] = useState<number>(initial.minutes);

  useEffect(() => {
    const p = parseValue(value);
    setInternalHours24(p.hours);
    setInternalMinutes(p.minutes);
  }, [value]);

  // Derived 12-hour values
  const isPM = internalHours24 >= 12;
  const displayHour12 = internalHours24 % 12 || 12;
  const displayHour = effectiveFormat === '12h' ? displayHour12 : internalHours24;

  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

  // Emit updated 24h time string
  const emitChange = (h24: number, m: number) => {
    const formatted = `${pad(h24)}:${pad(m)}`;
    onChange(formatted);
  };

  const handleHourChange = (newVal: number) => {
    if (effectiveFormat === '12h') {
      const clamped12 = Math.min(12, Math.max(1, newVal));
      let h24 = clamped12;
      if (isPM) {
        h24 = clamped12 === 12 ? 12 : clamped12 + 12;
      } else {
        h24 = clamped12 === 12 ? 0 : clamped12;
      }
      setInternalHours24(h24);
      emitChange(h24, internalMinutes);
    } else {
      const clamped24 = Math.min(23, Math.max(0, newVal));
      setInternalHours24(clamped24);
      emitChange(clamped24, internalMinutes);
    }
  };

  const handleMinuteChange = (newVal: number) => {
    const clampedM = Math.min(59, Math.max(0, newVal));
    setInternalMinutes(clampedM);
    emitChange(internalHours24, clampedM);
  };

  const handleAmPmToggle = (targetAmPm: 'AM' | 'PM') => {
    if (disabled) return;
    let newH24 = internalHours24;
    if (targetAmPm === 'AM' && isPM) {
      newH24 = internalHours24 - 12;
    } else if (targetAmPm === 'PM' && !isPM) {
      newH24 = internalHours24 + 12;
    }
    setInternalHours24(newH24);
    emitChange(newH24, internalMinutes);
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-blue-600" />
          <span>{label}</span>
          <span className="text-[10px] text-slate-400 font-normal">
            ({effectiveFormat === '12h' ? '12-Hour AM/PM' : '24-Hour Military'})
          </span>
        </label>
      )}

      <div className="flex items-center gap-2">
        {/* Hours & Minutes inputs */}
        <div className="flex items-center bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 shadow-2xs focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
          <input
            type="number"
            disabled={disabled}
            min={effectiveFormat === '12h' ? 1 : 0}
            max={effectiveFormat === '12h' ? 12 : 23}
            value={pad(displayHour)}
            onChange={(e) => handleHourChange(parseInt(e.target.value, 10) || 0)}
            className="w-10 text-center font-mono font-bold text-slate-800 text-sm outline-none bg-transparent"
          />
          <span className="font-bold text-slate-400 select-none px-0.5">:</span>
          <input
            type="number"
            disabled={disabled}
            min={0}
            max={59}
            value={pad(internalMinutes)}
            onChange={(e) => handleMinuteChange(parseInt(e.target.value, 10) || 0)}
            className="w-10 text-center font-mono font-bold text-slate-800 text-sm outline-none bg-transparent"
          />
        </div>

        {/* AM / PM Segmented Button Toggle (Rendered when 12h format is active) */}
        {effectiveFormat === '12h' && (
          <div className="inline-flex rounded-xl bg-slate-100 p-0.5 border border-slate-200 shrink-0 select-none shadow-2xs">
            <button
              type="button"
              disabled={disabled}
              onClick={() => handleAmPmToggle('AM')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                !isPM
                  ? 'bg-blue-600 text-white shadow-xs scale-102'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              AM
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => handleAmPmToggle('PM')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                isPM
                  ? 'bg-blue-600 text-white shadow-xs scale-102'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              PM
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
