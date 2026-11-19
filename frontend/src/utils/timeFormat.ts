import React, { useState, useEffect } from 'react';

export type TimeFormat = '12h' | '24h';

const STORAGE_KEY = 'odias_time_format';
const DEFAULT_FORMAT: TimeFormat = '12h';

/**
 * Get current system time format ('12h' or '24h')
 */
export function getTimeFormat(): TimeFormat {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === '12h' || saved === '24h') {
      return saved;
    }
  } catch (e) {
    // fallback
  }
  return DEFAULT_FORMAT;
}

/**
 * Update system time format ('12h' or '24h') and broadcast change
 */
export function setTimeFormat(format: TimeFormat): void {
  try {
    localStorage.setItem(STORAGE_KEY, format);
  } catch (e) {
    console.warn('Could not save time format preference', e);
  }
  // Dispatch custom event for real-time reactivity
  window.dispatchEvent(
    new CustomEvent('odias_time_format_changed', {
      detail: { format }
    })
  );
}

/**
 * Pad numbers with leading zeros (e.g. 5 -> "05")
 */
function pad(num: number | string): string {
  const n = typeof num === 'string' ? parseInt(num, 10) : num;
  if (isNaN(n)) return '00';
  return n < 10 ? `0${n}` : `${n}`;
}

/**
 * Convert any time representation into configured 12h (with AM/PM) or 24h format
 * @param value Date object, time string ("09:15:00", "18:30"), ISO string, or timestamp
 * @param options includeSeconds: boolean, forceFormat: '12h' | '24h'
 */
export function formatTime(
  value: Date | string | number | undefined | null,
  options?: { includeSeconds?: boolean; forceFormat?: TimeFormat }
): string {
  if (value === undefined || value === null || value === '') {
    return '--:--';
  }

  const format = options?.forceFormat || getTimeFormat();
  const showSeconds = options?.includeSeconds ?? false;

  // 1. If it's a simple time string like "09:30:15", "18:45", "9:5"
  if (typeof value === 'string' && /^\d{1,2}:\d{1,2}(:\d{1,2})?$/.test(value.trim())) {
    const parts = value.trim().split(':');
    let hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const seconds = parts[2] ? parseInt(parts[2], 10) : 0;

    if (isNaN(hours) || isNaN(minutes)) return value;

    if (format === '12h') {
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const h12 = hours % 12 || 12;
      const secStr = showSeconds && parts[2] !== undefined ? `:${pad(seconds)}` : '';
      return `${pad(h12)}:${pad(minutes)}${secStr} ${ampm}`;
    } else {
      // 24h format
      const secStr = showSeconds && parts[2] !== undefined ? `:${pad(seconds)}` : '';
      return `${pad(hours)}:${pad(minutes)}${secStr}`;
    }
  }

  // 2. If it's a Date, timestamp, or full ISO string
  const dateObj = value instanceof Date ? value : new Date(value);
  if (isNaN(dateObj.getTime())) {
    // If not parseable as Date, return as string
    return String(value);
  }

  if (format === '12h') {
    let hours = dateObj.getHours();
    const minutes = dateObj.getMinutes();
    const seconds = dateObj.getSeconds();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h12 = hours % 12 || 12;
    const secStr = showSeconds ? `:${pad(seconds)}` : '';
    return `${pad(h12)}:${pad(minutes)}${secStr} ${ampm}`;
  } else {
    // 24h format
    const hours = dateObj.getHours();
    const minutes = dateObj.getMinutes();
    const seconds = dateObj.getSeconds();
    const secStr = showSeconds ? `:${pad(seconds)}` : '';
    return `${pad(hours)}:${pad(minutes)}${secStr}`;
  }
}

/**
 * Custom React Hook that returns the active time format and reactivity listener
 */
export function useTimeFormat() {
  const [currentFormat, setCurrentFormat] = useState<TimeFormat>(getTimeFormat);

  useEffect(() => {
    const handleFormatChange = (e: any) => {
      if (e.detail?.format) {
        setCurrentFormat(e.detail.format);
      } else {
        setCurrentFormat(getTimeFormat());
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && (e.newValue === '12h' || e.newValue === '24h')) {
        setCurrentFormat(e.newValue);
      }
    };

    window.addEventListener('odias_time_format_changed', handleFormatChange);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('odias_time_format_changed', handleFormatChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const changeFormat = (newFmt: TimeFormat) => {
    setTimeFormat(newFmt);
    setCurrentFormat(newFmt);
  };

  const formatWithCurrent = (
    val: Date | string | number | undefined | null,
    opts?: { includeSeconds?: boolean }
  ) => {
    return formatTime(val, { ...opts, forceFormat: currentFormat });
  };

  return {
    timeFormat: currentFormat,
    setTimeFormat: changeFormat,
    formatTime: formatWithCurrent,
  };
}
