"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

interface Notification {
  event: string;
  at: string | null;
  detail: string;
  sectionId?: string;
}

const LAST_READ_KEY = "intomarketing_notifications_last_read";

interface NotificationPanelProps {
  onClose?: () => void;
  onNavigate?: (sectionId: string) => void;
}

export default function NotificationPanel({ onClose, onNavigate }: NotificationPanelProps = {}) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(false);
  const [, setTick] = useState(0);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{ notifications?: Notification[] }>("/api/notifications");
      setNotifications(data.notifications || []);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchNotifications();
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(LAST_READ_KEY, Date.now().toString());
      }
      setUnread(false);
    }
  }, [open, fetchNotifications]);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!open && notifications.length > 0) {
      const lastRead = typeof localStorage !== "undefined" ? parseInt(localStorage.getItem(LAST_READ_KEY) || "0", 10) : 0;
      const hasNew = notifications.some((n) => {
        if (!n.at) return true;
        const at = new Date(n.at).getTime();
        return at > lastRead;
      });
      setUnread(hasNew);
    }
  }, [open, notifications]);

  function formatTime(iso: string | null) {
    if (!iso) return "";
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-full p-2 text-apple-secondary hover:bg-apple-bg hover:text-apple-text"
        aria-label="Notifications"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread && (
          <span className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-red-500" />
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            className="absolute right-0 mt-2 w-80 max-h-[320px] overflow-y-auto rounded-apple-sm border border-apple-border bg-apple-card shadow-apple-lg z-50"
            role="dialog"
            aria-modal="true"
            aria-label="Notification center"
          >
            <div className="border-b border-apple-border px-4 py-3">
              <h3 className="text-sm font-semibold">Notifications</h3>
            </div>
            {loading ? (
              <div className="px-4 py-8 text-center text-sm text-apple-secondary">Loading…</div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-apple-secondary">No notifications</div>
            ) : (
              <ul className="divide-y divide-apple-border">
                {notifications.map((n, i) => {
                  const sectionId = n.event === "drafts_generated" ? "content" : n.event === "leads_qualified" ? "leads" : n.event === "pipeline_completed" ? "overview" : n.event === "billing" ? undefined : undefined;
                  const handleClick = () => {
                    onClose?.();
                    setOpen(false);
                    if (sectionId) {
                      onNavigate?.(sectionId);
                    }
                  };
                  return (
                    <li
                      key={`${n.event}-${n.at}-${i}`}
                      role="button"
                      tabIndex={0}
                      onClick={handleClick}
                      onKeyDown={(e) => e.key === "Enter" && handleClick()}
                      className="cursor-pointer px-4 py-3 text-sm hover:bg-apple-bg transition-colors"
                    >
                      <p className="text-apple-text">{n.detail}</p>
                      {n.at && (
                        <p className="mt-1 text-xs text-apple-secondary">{formatTime(n.at)}</p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
