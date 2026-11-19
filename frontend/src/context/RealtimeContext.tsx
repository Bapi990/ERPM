import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { X, ArrowRight, ExternalLink } from 'lucide-react';
import { useAuth } from './AuthContext';
import { api } from '../api/client';

export interface RealtimeEvent {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  severity: 'info' | 'success' | 'warning' | 'alert';
  target_user?: string;
  target_role?: string;
  link?: string;
}

interface RealtimeContextType {
  isConnected: boolean;
  latencyMs: number;
  recentEvents: RealtimeEvent[];
  emitEvent: (
    type: string,
    title: string,
    message: string,
    severity?: 'info' | 'success' | 'warning' | 'alert',
    target_user?: string,
    target_role?: string,
    link?: string
  ) => void;
  subscribe: (eventType: string, callback: (event: RealtimeEvent) => void) => () => void;
  lastEvent: RealtimeEvent | null;
  playNotificationSound: () => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

// Web Audio API synthesizer for crisp notification chime
export const playNotificationSound = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Pleasant dual-pitch chime: 880Hz (A5) ramping down
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(587.33, ctx.currentTime + 0.15); // D5

    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (e) {
    // Autoplay restrictions or audio context not ready
  }
};

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [latencyMs, setLatencyMs] = useState<number>(24);
  const [recentEvents, setRecentEvents] = useState<RealtimeEvent[]>([]);
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);

  const subscribersRef = useRef<Map<string, Set<(event: RealtimeEvent) => void>>>(new Map());
  const seenNotificationIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef(true);

  // Auto-dismiss floating toast after 5 seconds
  useEffect(() => {
    if (!lastEvent) return;
    const timer = setTimeout(() => {
      setLastEvent(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [lastEvent]);

  // Check if an event is targeted to the current active user
  const isTargetedToUser = useCallback((target_user?: string, target_role?: string) => {
    if (!target_user && !target_role) return true;
    if (!user) return true;
    // Super admin receives all enterprise notifications
    if (user.role_code === 'super_admin') return true;

    if (target_role && target_role === user.role_code) return true;

    if (target_user) {
      const lowerTarget = target_user.toLowerCase().trim();
      const userFullName = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase().trim();
      const userEmail = (user.email || '').toLowerCase().trim();
      const username = (user.username || '').toLowerCase().trim();
      const empId = ((user as any).employee_id || '').toLowerCase().trim();
      const userId = (user.id || '').toLowerCase().trim();

      if (lowerTarget === userId) return true;
      if (lowerTarget === userEmail) return true;
      if (lowerTarget === username) return true;
      if (lowerTarget === empId) return true;
      if (userFullName && (lowerTarget.includes(userFullName) || userFullName.includes(lowerTarget))) return true;
      if (user.first_name && lowerTarget.includes(user.first_name.toLowerCase())) return true;
    }

    return false;
  }, [user]);

  const emitEvent = useCallback((
    type: string,
    title: string,
    message: string,
    severity: 'info' | 'success' | 'warning' | 'alert' = 'info',
    target_user?: string,
    target_role?: string,
    link?: string
  ) => {
    const event: RealtimeEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      type,
      title,
      message,
      timestamp: new Date().toLocaleTimeString(),
      severity,
      target_user,
      target_role,
      link,
    };

    setRecentEvents((prev) => [event, ...prev.slice(0, 24)]);

    const relevant = isTargetedToUser(target_user, target_role);
    if (relevant) {
      setLastEvent(event);
      playNotificationSound();
    }

    // Persist to user local notification history
    try {
      const userKey = `odias_user_notifications_${user?.email || 'default'}`;
      const existing = JSON.parse(localStorage.getItem(userKey) || '[]');
      const notifItem = {
        id: event.id,
        title: event.title,
        message: event.message,
        notification_type: severity === 'alert' ? 'warning' : severity,
        link: event.link || '',
        is_read: false,
        created_at: new Date().toISOString(),
      };
      localStorage.setItem(userKey, JSON.stringify([notifItem, ...existing.slice(0, 49)]));
    } catch (e) {}

    // Dispatch global event for AppShell & pages
    window.dispatchEvent(new CustomEvent('odias_realtime_notification', { detail: event }));

    // Notify registered subscribers
    const listeners = subscribersRef.current.get(type);
    if (listeners) {
      listeners.forEach((cb) => {
        try {
          cb(event);
        } catch (e) {
          console.error('Subscriber callback error:', e);
        }
      });
    }

    // Also notify wildcard listeners
    const allListeners = subscribersRef.current.get('*');
    if (allListeners) {
      allListeners.forEach((cb) => cb(event));
    }
  }, [isTargetedToUser, user]);

  const subscribe = useCallback((eventType: string, callback: (event: RealtimeEvent) => void) => {
    if (!subscribersRef.current.has(eventType)) {
      subscribersRef.current.set(eventType, new Set());
    }
    subscribersRef.current.get(eventType)!.add(callback);

    return () => {
      const list = subscribersRef.current.get(eventType);
      if (list) {
        list.delete(callback);
      }
    };
  }, []);

  // Background Sync Poller (simulating live Channels WebSocket stream)
  useEffect(() => {
    if (!user) return;

    let isMounted = true;
    const interval = setInterval(async () => {
      if (!isMounted) return;
      const start = performance.now();
      try {
        const notifs = await api.getNotifications();
        const list = notifs.results || notifs || [];
        const elapsed = Math.round(performance.now() - start);
        if (isMounted) {
          setLatencyMs(Math.max(12, Math.min(85, elapsed)));
          setIsConnected(true);
        }

        if (isInitialLoadRef.current) {
          list.forEach((n: any) => seenNotificationIdsRef.current.add(n.id));
          isInitialLoadRef.current = false;
        } else {
          list.forEach((n: any) => {
            if (!n.is_read && !seenNotificationIdsRef.current.has(n.id)) {
              seenNotificationIdsRef.current.add(n.id);
              emitEvent(
                'notification',
                n.title,
                n.message,
                n.notification_type === 'action_required' ? 'warning' : 'info',
                n.user_email || undefined,
                undefined,
                n.link
              );
            }
          });
        }
      } catch (err) {
        if (isMounted) setIsConnected(false);
      }
    }, 6000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [user, emitEvent]);

  return (
    <RealtimeContext.Provider
      value={{
        isConnected,
        latencyMs,
        recentEvents,
        emitEvent,
        subscribe,
        lastEvent,
        playNotificationSound,
      }}
    >
      {children}

      {/* Floating Realtime Live Toast Alert */}
      {lastEvent && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-slate-700/80 animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[10px] font-mono tracking-wider uppercase text-emerald-400 font-bold">
                Realtime Event • {lastEvent.type}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] text-slate-400 font-mono">{lastEvent.timestamp}</span>
              <button
                onClick={() => setLastEvent(null)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <p className="text-xs font-bold text-white mt-1.5">{lastEvent.title}</p>
          <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">{lastEvent.message}</p>
          {lastEvent.link && (
            <div className="mt-2.5 pt-2 border-t border-slate-800 flex justify-end">
              <a
                href={lastEvent.link}
                onClick={() => setLastEvent(null)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-400 hover:text-blue-300 hover:underline"
              >
                <span>View Task / Project</span>
                <ArrowRight className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>
      )}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within RealtimeProvider');
  }
  return context;
};
