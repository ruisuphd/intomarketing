"use client";

import { useCallback, useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { apiFetch } from "@/lib/api";

interface CommandItem {
  id: string;
  type: "draft" | "lead" | "intel";
  label: string;
  sectionId?: string;
}

interface CommandPaletteProps {
  enabled?: boolean;
}

const SECTION_LABELS: Record<string, string> = {
  draft: "Drafts",
  lead: "Leads",
  intel: "Intelligence",
};

export default function CommandPalette({ enabled = true }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const [loading, setLoading] = useState(false);
  const [drafts, setDrafts] = useState<{ id?: string; headline?: string }[]>([]);
  const [leads, setLeads] = useState<{ id?: string; company_name?: string; contact_name?: string }[]>([]);
  const [intel, setIntel] = useState<{ id?: string; title?: string; summary?: string }[]>([]);

  useEffect(() => {
    if (open && enabled) {
      setLoading(true);
      Promise.allSettled([
        apiFetch<{ drafts?: { id?: string; headline?: string }[] }>("/api/drafts?limit=20").then((d) => d.drafts || []),
        apiFetch<{ leads?: { id?: string; company_name?: string; contact_name?: string }[] }>("/api/leads?limit=20").then((d) => d.leads || []),
        apiFetch<{ items?: { id?: string; title?: string; summary?: string }[] }>("/api/intelligence?limit=20").then((d) => d.items || []),
      ]).then(([d, l, i]) => {
        setDrafts(d.status === "fulfilled" ? d.value : []);
        setLeads(l.status === "fulfilled" ? l.value : []);
        setIntel(i.status === "fulfilled" ? i.value : []);
        setLoading(false);
      });
    }
  }, [open, enabled]);

  const items: CommandItem[] = [
    ...drafts.slice(0, 10).map((d, i) => ({
      id: d.id ? `draft-${d.id}` : `draft-${i}`,
      type: "draft" as const,
      label: (d.headline || d.id || "Draft").slice(0, 60),
      sectionId: "content",
    })),
    ...leads.slice(0, 10).map((l, i) => ({
      id: l.id ? `lead-${l.id}` : `lead-${i}`,
      type: "lead" as const,
      label: [l.company_name, l.contact_name].filter(Boolean).join(" · ") || l.id || "Lead",
      sectionId: "leads",
    })),
    ...intel.slice(0, 10).map((it, i) => ({
      id: it.id ? `intel-${it.id}` : `intel-${i}`,
      type: "intel" as const,
      label: (it.title || it.summary || it.id || "Signal").slice(0, 60),
      sectionId: "intelligence",
    })),
  ];

  const filtered = query.trim()
    ? items.filter(
        (it) =>
          it.label.toLowerCase().includes(query.toLowerCase()) ||
          it.type.toLowerCase().includes(query.toLowerCase())
      )
    : items;

  const grouped = filtered.reduce<Record<string, CommandItem[]>>((acc, it) => {
    const key = it.type;
    if (!acc[key]) acc[key] = [];
    acc[key].push(it);
    return acc;
  }, {});

  const flatItems = Object.values(grouped).flat();
  const currentItem = flatItems[selected] ?? null;

  const handleSelect = useCallback(
    (item: CommandItem) => {
      if (item.sectionId) {
        document.getElementById(item.sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      setOpen(false);
      setQuery("");
      setSelected(0);
    },
    []
  );

  useEffect(() => {
    setSelected(0);
  }, [query]);

  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
        setQuery("");
        setSelected(0);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelected((s) => Math.min(s + 1, flatItems.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelected((s) => Math.max(s - 1, 0));
      } else if (e.key === "Enter" && currentItem) {
        e.preventDefault();
        handleSelect(currentItem);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, flatItems.length, currentItem, handleSelect]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/40" />
        <Dialog.Content
          className="fixed left-1/2 top-[20%] z-[61] w-full max-w-lg -translate-x-1/2 rounded-apple border border-apple-border bg-white shadow-2xl"
          aria-label="Command palette"
          aria-describedby="command-palette-desc"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <div className="border-b border-apple-border px-4 py-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search drafts, leads, intelligence…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-apple-secondary"
              autoFocus
              id="command-palette-desc"
            />
          </div>
          <div className="max-h-64 overflow-y-auto py-2">
            {loading ? (
              <div className="space-y-2 px-4 py-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-8 animate-pulse rounded bg-apple-bg" />
                ))}
              </div>
            ) : flatItems.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-apple-secondary">No results</p>
            ) : (
              Object.entries(grouped).map(([type, groupItems]) => (
                <div key={type} className="mb-2">
                  <p className="px-4 py-1 text-xs font-medium text-apple-secondary">
                    {SECTION_LABELS[type] ?? type}
                  </p>
                  {groupItems.map((item) => {
                    const idx = flatItems.indexOf(item);
                    const isSelected = idx === selected;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelect(item)}
                        onMouseEnter={() => setSelected(idx)}
                        className={`w-full px-4 py-2 text-left text-sm ${
                          isSelected ? "bg-apple-bg" : ""
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>
          <div className="border-t border-apple-border px-4 py-2 text-xs text-apple-secondary">
            ↑↓ Navigate · Enter Select · Esc Close
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
