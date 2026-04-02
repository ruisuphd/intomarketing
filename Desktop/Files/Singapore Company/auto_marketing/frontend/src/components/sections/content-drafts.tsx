"use client";

import { useCallback, useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { apiFetch } from "@/lib/api";
import LockedState from "@/components/ui/locked-state";
import Notice from "@/components/ui/notice";
import CopyButton from "@/components/ui/copy-button";
import { useToast } from "@/components/ui/toast";
import { hasTierAccess } from "@/lib/billing";
import {
  ALL_PLATFORMS,
  PLATFORM_BY_ID,
  getDraftText,
  normalizePlatforms,
} from "@/lib/platforms";
import type { BillingSummary, DraftContent, PlatformId } from "@/types";

interface ContentDraftsSectionProps {
  billing: BillingSummary | null;
  platforms: PlatformId[];
  oauthStatus?: { linkedin: boolean; x_twitter: boolean } | null;
}

interface EditDraftFormProps {
  draft: DraftContent;
  enabledPlatforms: PlatformId[];
  onSave: (data: {
    headline: string;
    content_by_platform: Record<string, string>;
    hashtags: string[];
    why_it_matters: string;
  }) => void;
  onCancel: () => void;
  onDirtyChange?: (dirty: boolean) => void;
}

function EditDraftForm({ draft, enabledPlatforms, onSave, onCancel, onDirtyChange }: EditDraftFormProps) {
  const [headline, setHeadline] = useState(draft.headline || "");
  const [contentByPlatform, setContentByPlatform] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const p of enabledPlatforms) {
      init[p] = getDraftText(draft, p);
    }
    return init;
  });
  const [hashtags, setHashtags] = useState(draft.hashtags?.join(" ") || "");
  const [whyItMatters, setWhyItMatters] = useState(draft.why_it_matters || "");

  const initialSnapshot = JSON.stringify({
    headline: draft.headline || "",
    ...Object.fromEntries(enabledPlatforms.map((p) => [p, getDraftText(draft, p)])),
    hashtags: draft.hashtags?.join(" ") || "",
    why_it_matters: draft.why_it_matters || "",
  });
  const currentSnapshot = JSON.stringify({
    headline,
    ...contentByPlatform,
    hashtags,
    why_it_matters: whyItMatters,
  });
  const isDirty = initialSnapshot !== currentSnapshot;

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cp: Record<string, string> = {};
    for (const p of enabledPlatforms) {
      const v = contentByPlatform[p]?.trim();
      if (v) cp[p] = v;
    }
    onDirtyChange?.(false);
    onSave({
      headline: headline.trim(),
      content_by_platform: cp,
      hashtags: hashtags.trim() ? hashtags.trim().split(/\s+/).filter(Boolean) : [],
      why_it_matters: whyItMatters.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Dialog.Title className="mb-4 text-lg font-semibold">Edit draft</Dialog.Title>
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-apple-text">Headline</label>
          <input
            type="text"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            className="w-full rounded-apple-sm border border-apple-border px-3 py-2 text-sm"
          />
        </div>
        {enabledPlatforms.map((platformId) => (
          <div key={platformId}>
            <label className="mb-1 block text-sm font-medium text-apple-text">
              {PLATFORM_BY_ID[platformId]?.label ?? platformId}
            </label>
            <textarea
              value={contentByPlatform[platformId] ?? ""}
              onChange={(e) =>
                setContentByPlatform((prev) => ({ ...prev, [platformId]: e.target.value }))
              }
              rows={3}
              className="w-full rounded-apple-sm border border-apple-border px-3 py-2 text-sm"
            />
          </div>
        ))}
        <div>
          <label className="mb-1 block text-sm font-medium text-apple-text">Hashtags</label>
          <input
            type="text"
            value={hashtags}
            onChange={(e) => setHashtags(e.target.value)}
            placeholder="#tag1 #tag2"
            className="w-full rounded-apple-sm border border-apple-border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-apple-text">
            Why it matters
          </label>
          <textarea
            value={whyItMatters}
            onChange={(e) => setWhyItMatters(e.target.value)}
            rows={2}
            className="w-full rounded-apple-sm border border-apple-border px-3 py-2 text-sm"
          />
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-apple-sm border border-apple-border px-4 py-2 text-sm font-medium text-apple-text hover:bg-apple-bg"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-apple-sm bg-apple-blue px-4 py-2 text-sm font-medium text-white hover:bg-apple-blue-hover"
        >
          Save
        </button>
      </div>
    </form>
  );
}

function sortDrafts(items: DraftContent[]): DraftContent[] {
  return [...items].sort((a, b) => {
    const aTime = new Date(a.created_at || a.updated_at || a.batch_date).getTime();
    const bTime = new Date(b.created_at || b.updated_at || b.batch_date).getTime();
    return bTime - aTime;
  });
}

export default function ContentDraftsSection({
  billing,
  platforms,
  oauthStatus,
}: ContentDraftsSectionProps) {
  const enabledPlatforms = normalizePlatforms(platforms);
  const [drafts, setDrafts] = useState<DraftContent[]>([]);
  const [platform, setPlatform] = useState<PlatformId>(enabledPlatforms[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);
  const [editingDraft, setEditingDraft] = useState<DraftContent | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [votedThumbs, setVotedThumbs] = useState<Record<string, "up" | "down">>({});
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [editFormDirty, setEditFormDirty] = useState(false);
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);
  const [previewingDraft, setPreviewingDraft] = useState<DraftContent | null>(null);
  const [bulkApproving, setBulkApproving] = useState(false);
  const [historyDraft, setHistoryDraft] = useState<DraftContent | null>(null);
  const [historyItems, setHistoryItems] = useState<{ id?: string; headline: string; content_by_platform: Record<string, string>; saved_at: string }[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [pendingDiscardAction, setPendingDiscardAction] = useState<(() => void) | null>(null);
  const [showFirstPostCelebration, setShowFirstPostCelebration] = useState(false);
  const [ideasOpen, setIdeasOpen] = useState(false);
  const [ideas, setIdeas] = useState<{ id: string; text: string; added_at: string }[]>([]);
  const [ideaText, setIdeaText] = useState("");
  const [ideaAdding, setIdeaAdding] = useState(false);
  const { toast } = useToast();

  function requestDiscard(action: () => void) {
    setPendingDiscardAction(() => action);
    setDiscardConfirmOpen(true);
  }

  function confirmDiscard() {
    pendingDiscardAction?.();
    setPendingDiscardAction(null);
    setDiscardConfirmOpen(false);
    setEditFormDirty(false);
    setEditingDraft(null);
  }

  useEffect(() => {
    if (!enabledPlatforms.includes(platform)) {
      setPlatform(enabledPlatforms[0]);
    }
  }, [enabledPlatforms, platform]);

  const fetchDrafts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch<{ drafts?: DraftContent[]; next_cursor?: string }>(
        "/api/drafts?status=draft&limit=20"
      );
      const draftList = sortDrafts(data.drafts || []);
      setDrafts(draftList);
      setNextCursor(data.next_cursor || null);
      setVotedThumbs((prev) => {
        const next = { ...prev };
        for (const d of draftList) {
          if (d.id && d.feedback_thumbs) {
            next[d.id] = d.feedback_thumbs;
          }
        }
        return next;
      });
    } catch (e: any) {
      setError(e.message === "Failed to fetch" ? "Unable to reach the server. Please try refreshing the page." : e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  async function handleLoadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    setError("");
    try {
      const data = await apiFetch<{ drafts?: DraftContent[]; next_cursor?: string }>(
        `/api/drafts?status=draft&limit=20&cursor=${encodeURIComponent(nextCursor)}`
      );
      setDrafts((prev) => sortDrafts([...prev, ...(data.drafts || [])]));
      setNextCursor(data.next_cursor || null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    if (billing && hasTierAccess(billing, "starter")) {
      fetchDrafts();
      apiFetch<{ ideas: { id: string; text: string; added_at: string }[] }>("/api/content-ideas")
        .then((d) => setIdeas(d.ideas || []))
        .catch(() => {});
      return;
    }
    setDrafts([]);
    setLoading(false);
  }, [billing, fetchDrafts]);

  async function handleGenerate() {
    setGenerating(true);
    setError("");
    try {
      const result = await apiFetch<DraftContent>("/api/drafts/quick-generate", {
        method: "POST",
        body: JSON.stringify({ platform }),
      });
      setDrafts((prev) =>
        sortDrafts([result, ...prev.filter((draft) => draft.id !== result.id)]),
      );
      window.dispatchEvent(new Event("drafts:changed"));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  }

  async function handleSchedule(draft: DraftContent) {
    if (!draft.id) return;
    setError("");
    try {
      const result = await apiFetch<{ ok: boolean; first_post?: boolean; approval_streak?: number }>(`/api/drafts/${draft.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          status: "scheduled",
          batch_date: draft.batch_date,
        }),
      });
      setDrafts((prev) => prev.filter((d) => d.id !== draft.id));
      window.dispatchEvent(new Event("drafts:changed"));
      if (result.first_post) {
        setShowFirstPostCelebration(true);
      }
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function handleDelete(draft: DraftContent) {
    if (!draft.id) return;
    if (deleteConfirmId !== draft.id) {
      setDeleteConfirmId(draft.id);
      return;
    }
    setError("");
    try {
      await apiFetch(`/api/drafts/${draft.id}`, { method: "DELETE" });
      setDrafts((prev) => prev.filter((d) => d.id !== draft.id));
      setDeleteConfirmId(null);
      window.dispatchEvent(new Event("drafts:changed"));
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function handleRegenerate(draft: DraftContent) {
    if (!draft.id) return;
    setRegeneratingId(draft.id);
    setError("");
    try {
      const result = await apiFetch<DraftContent>(`/api/drafts/${draft.id}/regenerate`, {
        method: "POST",
      });
      setDrafts((prev) =>
        sortDrafts(prev.map((d) => (d.id === draft.id ? result : d)))
      );
      window.dispatchEvent(new Event("drafts:changed"));
      toast("Draft regenerated", "success");
    } catch (e: any) {
      setError(e.message);
      toast("Couldn't regenerate — try again", "error");
    } finally {
      setRegeneratingId(null);
    }
  }

  async function handleFeedback(draft: DraftContent, thumbs: "up" | "down") {
    if (!draft.id || votedThumbs[draft.id]) return;
    try {
      await apiFetch(`/api/drafts/${draft.id}/feedback`, {
        method: "POST",
        body: JSON.stringify({ thumbs }),
      });
      setVotedThumbs((prev) => ({ ...prev, [draft.id!]: thumbs }));
      toast("Thanks for your feedback", "success");
    } catch {
      toast("Feedback could not be saved", "error");
    }
  }

  async function handleEditSave(formData: {
    headline: string;
    content_by_platform: Record<string, string>;
    hashtags: string[];
    why_it_matters: string;
  }) {
    if (!editingDraft?.id) return;
    setError("");
    try {
      const result = await apiFetch<{ draft: DraftContent }>(
        `/api/drafts/${editingDraft.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            headline: formData.headline,
            content_by_platform: formData.content_by_platform,
            hashtags: formData.hashtags,
            why_it_matters: formData.why_it_matters,
          }),
        }
      );
      setDrafts((prev) =>
        sortDrafts(
          prev.map((d) => (d.id === editingDraft.id ? { ...d, ...result.draft } : d))
        )
      );
      setEditingDraft(null);
      window.dispatchEvent(new Event("drafts:changed"));
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function handleOpenHistory(draft: DraftContent) {
    setHistoryDraft(draft);
    setHistoryItems([]);
    setHistoryLoading(true);
    try {
      const data = await apiFetch<{ history?: typeof historyItems }>(`/api/drafts/${draft.id}/history`);
      setHistoryItems(data.history || []);
    } catch {
      setHistoryItems([]);
    } finally {
      setHistoryLoading(false);
    }
  }

  async function handleBulkApprove() {
    const pending = visibleDrafts.filter((d) => d.status !== "scheduled").map((d) => d.id).filter(Boolean) as string[];
    if (pending.length === 0) return;
    if (!window.confirm(`Approve and schedule all ${pending.length} visible draft(s)?`)) return;
    setBulkApproving(true);
    try {
      const result = await apiFetch<{ approved: number }>("/api/drafts/bulk-approve", {
        method: "POST",
        body: JSON.stringify({ draft_ids: pending }),
      });
      setDrafts((prev) =>
        prev.map((d) => (pending.includes(d.id ?? "") ? { ...d, status: "scheduled" } : d))
      );
      toast(`${result.approved} draft(s) scheduled`, "success");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBulkApproving(false);
    }
  }

  async function handleAddIdea() {
    const text = ideaText.trim();
    if (!text) return;
    setIdeaAdding(true);
    try {
      const result = await apiFetch<{ ok: boolean; idea: { id: string; text: string; added_at: string } }>("/api/content-ideas", {
        method: "POST",
        body: JSON.stringify({ text }),
      });
      setIdeas((prev) => [...prev, result.idea]);
      setIdeaText("");
    } catch (e: any) {
      toast(e.message || "Failed to add idea", "error");
    } finally {
      setIdeaAdding(false);
    }
  }

  async function handleDeleteIdea(ideaId: string) {
    try {
      await apiFetch(`/api/content-ideas/${ideaId}`, { method: "DELETE" });
      setIdeas((prev) => prev.filter((i) => i.id !== ideaId));
    } catch (e: any) {
      toast(e.message || "Failed to remove idea", "error");
    }
  }

  const visibleDrafts = drafts.filter((draft) => {
    const rawPlatforms =
      draft.platforms_generated && draft.platforms_generated.length > 0
        ? draft.platforms_generated
        : draft.platform
          ? [draft.platform]
          : [];
    const draftPlatforms =
      rawPlatforms.length > 0 ? normalizePlatforms(rawPlatforms) : [];
    return draftPlatforms.includes(platform) && Boolean(getDraftText(draft, platform));
  });

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Content Drafts</h2>
          <p className="text-sm text-apple-secondary">
            Each pack includes channel-specific copy for your enabled platforms. Publishing may be manual or via
            integrations as we ship them.
          </p>
        </div>
        {billing && hasTierAccess(billing, "starter") && (
          <div className="flex items-center gap-2">
            {visibleDrafts.filter((d) => d.status !== "scheduled").length > 1 && (
              <button
                onClick={() => void handleBulkApprove()}
                disabled={bulkApproving}
                className="rounded-apple-sm border border-apple-border px-4 py-2 text-sm font-medium text-apple-text hover:bg-apple-bg disabled:opacity-50"
              >
                {bulkApproving ? "Scheduling…" : "Approve all"}
              </button>
            )}
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="rounded-apple-sm bg-apple-blue px-4 py-2 text-sm font-medium text-white hover:bg-apple-blue-hover disabled:opacity-50"
            >
              {generating ? "Generating..." : "Write a post"}
            </button>
          </div>
        )}
      </div>

      {billing && !hasTierAccess(billing, "starter") && (
        <LockedState
          description="Content drafts are available on the Starter and Pro plans."
          ctaLabel="Unlock Starter"
        />
      )}

      {billing && !hasTierAccess(billing, "starter") ? null : (
        <>
          <div className="mb-4 space-y-2">
            <Notice tone="neutral">
              Drafts are production-ready text and assets. Auto-publish to all six channels is not guaranteed yet—copy
              to your tools or use linked accounts where available.
            </Notice>
            {oauthStatus && !oauthStatus.linkedin && !oauthStatus.x_twitter && (
              <Notice tone="neutral">
                Connect LinkedIn or X in{" "}
                <a href="/settings#platforms" className="font-medium underline">
                  Settings → Platforms
                </a>{" "}
                to enable auto-publishing.
              </Notice>
            )}
          </div>
          {/* Ideas queue */}
          <div className="mb-4 rounded-apple border border-apple-border bg-apple-card shadow-apple overflow-hidden">
            <button
              type="button"
              onClick={() => setIdeasOpen((v) => !v)}
              className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium hover:bg-apple-bg"
            >
              <span>💡 Ideas queue {ideas.length > 0 ? `(${ideas.length})` : ""}</span>
              <span className="text-apple-secondary text-xs">{ideasOpen ? "▲" : "▼"}</span>
            </button>
            {ideasOpen && (
              <div className="border-t border-apple-border px-4 pb-4 pt-3 space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={ideaText}
                    onChange={(e) => setIdeaText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void handleAddIdea(); } }}
                    placeholder="e.g. Post about our new pricing update"
                    maxLength={500}
                    className="flex-1 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => void handleAddIdea()}
                    disabled={ideaAdding || !ideaText.trim()}
                    className="rounded-apple-sm bg-apple-blue px-3 py-1.5 text-xs font-medium text-white hover:bg-apple-blue-hover disabled:opacity-50"
                  >
                    {ideaAdding ? "Adding…" : "Add"}
                  </button>
                </div>
                {ideas.length > 0 ? (
                  <ul className="space-y-1.5">
                    {ideas.map((idea) => (
                      <li key={idea.id} className="flex items-start justify-between gap-2 rounded-md bg-apple-bg px-3 py-2 text-sm">
                        <span className="min-w-0 flex-1 break-words">{idea.text}</span>
                        <button
                          type="button"
                          onClick={() => void handleDeleteIdea(idea.id)}
                          className="shrink-0 text-xs text-apple-secondary hover:text-red-500"
                          aria-label="Remove idea"
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-apple-secondary">No ideas queued yet. Ideas feed into the AI when generating content.</p>
                )}
              </div>
            )}
          </div>

          <div className="mb-4 flex gap-1 overflow-x-auto rounded-apple-sm bg-apple-card p-1 shadow-apple [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {ALL_PLATFORMS.filter((item) => enabledPlatforms.includes(item.id)).map((item) => (
              <button
                key={item.id}
                onClick={() => setPlatform(item.id)}
                className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  platform === item.id
                    ? "bg-apple-text text-white"
                    : "text-apple-secondary hover:bg-apple-bg"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {error && <p className="mb-3 text-sm text-red-500">{error}</p>}

          {loading ? (
            <p className="py-8 text-center text-sm text-apple-secondary">Loading...</p>
          ) : visibleDrafts.length === 0 ? (
            <div className="rounded-apple bg-apple-card px-5 py-8 text-center shadow-apple">
              <p className="text-sm font-medium">
                No {PLATFORM_BY_ID[platform].label} drafts yet
              </p>
              <p className="mt-1 text-sm text-apple-secondary">
                Your AI pipeline runs at 07:00 SGT.{" "}
                <button
                  type="button"
                  className="text-apple-blue hover:underline"
                  onClick={() => void handleGenerate()}
                >
                  Run now
                </button>{" "}
                or check back later.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleDrafts.map((draft, index) => {
                const text = getDraftText(draft, platform);
                return (
                  <div
                    key={draft.id || index}
                    className="rounded-apple bg-apple-card p-5 shadow-apple"
                  >
                    {draft.image_url && (
                      <div className="mb-3">
                        <img
                          src={draft.image_url}
                          alt=""
                          className="max-h-48 rounded-apple-sm object-cover"
                        />
                      </div>
                    )}
                    {draft.headline && (
                      <p className="mb-2 text-sm font-semibold">{draft.headline}</p>
                    )}
                    <div className="flex items-start justify-between gap-3">
                      <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-apple-text flex-1">
                        {text}
                      </p>
                      <CopyButton text={text} label="post" className="flex-shrink-0 mt-0.5" />
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-xs text-apple-secondary">
                      <span>{text.length} chars</span>
                      {draft.hashtags?.length > 0 && <span>{draft.hashtags.join(" ")}</span>}
                    </div>
                    {draft.why_it_matters && (
                      <p className="mt-3 text-sm text-apple-secondary">
                        {draft.why_it_matters}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleSchedule(draft)}
                        className="inline-flex items-center gap-1.5 rounded-apple-sm bg-apple-blue px-4 py-1.5 text-xs font-medium text-white hover:bg-apple-blue-hover"
                      >
                        Approve & Schedule
                        <kbd className="font-mono text-[10px] border border-white/30 rounded px-1 py-0.5 opacity-70">⌘↵</kbd>
                      </button>
                      <button
                        onClick={() => setPreviewingDraft(draft)}
                        className="rounded-apple-sm border border-apple-border px-4 py-1.5 text-xs font-medium text-apple-text hover:bg-apple-bg"
                      >
                        Preview
                      </button>
                      <button
                        onClick={() => setEditingDraft(draft)}
                        className="rounded-apple-sm border border-apple-border px-4 py-1.5 text-xs font-medium text-apple-text hover:bg-apple-bg"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => void handleOpenHistory(draft)}
                        className="rounded-apple-sm border border-apple-border px-4 py-1.5 text-xs font-medium text-apple-secondary hover:bg-apple-bg"
                      >
                        History
                      </button>
                      <button
                        onClick={() => handleRegenerate(draft)}
                        disabled={regeneratingId === draft.id}
                        className="rounded-apple-sm border border-apple-border px-4 py-1.5 text-xs font-medium text-apple-text hover:bg-apple-bg disabled:opacity-50"
                      >
                        {regeneratingId === draft.id ? "Regenerating..." : "Regenerate"}
                      </button>
                      <span className="mx-1 text-apple-border">|</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleFeedback(draft, "up")}
                          disabled={!!votedThumbs[draft.id || ""]}
                          className={`rounded p-1 ${votedThumbs[draft.id || ""] ? "opacity-50 cursor-not-allowed" : "hover:bg-apple-bg"} ${(votedThumbs[draft.id || ""] || (draft as { feedback_thumbs?: string }).feedback_thumbs) === "up" ? "text-green-600 bg-green-50" : "text-apple-secondary hover:text-green-600"}`}
                          aria-label="Good"
                        >
                          &#x1F44D;
                        </button>
                        <button
                          onClick={() => handleFeedback(draft, "down")}
                          disabled={!!votedThumbs[draft.id || ""]}
                          className={`rounded p-1 ${votedThumbs[draft.id || ""] ? "opacity-50 cursor-not-allowed" : "hover:bg-apple-bg"} ${(votedThumbs[draft.id || ""] || (draft as { feedback_thumbs?: string }).feedback_thumbs) === "down" ? "text-red-500 bg-red-50" : "text-apple-secondary hover:text-red-500"}`}
                          aria-label="Poor"
                        >
                          &#x1F44E;
                        </button>
                      </div>
                      {deleteConfirmId === draft.id ? (
                        <>
                          <button
                            onClick={() => handleDelete(draft)}
                            className="rounded-apple-sm border border-red-500 px-4 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50"
                          >
                            Confirm delete
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="rounded-apple-sm border border-apple-border px-4 py-1.5 text-xs font-medium text-apple-secondary hover:bg-apple-bg"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleDelete(draft)}
                          className="rounded-apple-sm border border-apple-border px-4 py-1.5 text-xs font-medium text-apple-secondary hover:bg-apple-bg"
                        >
                          Delete
                        </button>
                      )}
                      <button
                        onClick={handleGenerate}
                        className="rounded-apple-sm border border-apple-border px-4 py-1.5 text-xs font-medium text-apple-text hover:bg-apple-bg"
                      >
                        Generate another
                      </button>
                    </div>
                  </div>
                );
              })}
              {nextCursor && (
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="mt-4 w-full rounded-apple-sm border border-apple-border py-2 text-sm font-medium text-apple-secondary hover:bg-apple-bg disabled:opacity-50"
                >
                  {loadingMore ? "Loading..." : "Load more drafts"}
                </button>
              )}
            </div>
          )}
        </>
      )}

      <Dialog.Root
        open={!!editingDraft}
        onOpenChange={(o) => {
          if (!o) {
            if (editFormDirty) {
              requestDiscard(() => {});
            } else {
              setEditingDraft(null);
            }
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50" />
          <Dialog.Content
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-apple bg-apple-card p-6 shadow-apple"
            onPointerDownOutside={(e) => {
              if (editFormDirty) {
                e.preventDefault();
                requestDiscard(() => {});
              }
            }}
            onEscapeKeyDown={(e) => {
              if (editFormDirty) {
                e.preventDefault();
                requestDiscard(() => {});
              }
            }}
          >
            {editingDraft && (
              <EditDraftForm
                draft={editingDraft}
                enabledPlatforms={enabledPlatforms}
                onSave={handleEditSave}
                onCancel={() => {
                  if (editFormDirty) {
                    requestDiscard(() => {});
                  } else {
                    setEditingDraft(null);
                  }
                }}
                onDirtyChange={setEditFormDirty}
              />
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={discardConfirmOpen} onOpenChange={setDiscardConfirmOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[70] bg-black/50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-[71] w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-apple bg-apple-card p-6 shadow-apple">
            <Dialog.Title className="text-lg font-semibold">Discard unsaved changes?</Dialog.Title>
            <p className="mt-2 text-sm text-apple-secondary">Your edits will not be saved.</p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setDiscardConfirmOpen(false); setPendingDiscardAction(null); }}
                className="rounded-apple-sm border border-apple-border px-4 py-2 text-sm font-medium text-apple-text hover:bg-apple-bg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDiscard}
                className="rounded-apple-sm bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
              >
                Discard
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Post Preview Modal */}
      <Dialog.Root open={!!previewingDraft} onOpenChange={(o) => { if (!o) setPreviewingDraft(null); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50" />
          <Dialog.Content
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-apple bg-apple-card p-6 shadow-apple focus:outline-none"
            aria-modal
            aria-labelledby="preview-modal-title"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 id="preview-modal-title" className="text-sm font-semibold text-apple-secondary uppercase tracking-wide">
                Post Preview — {platform.replace("_", " ")}
              </h3>
              <Dialog.Close className="rounded p-1 text-apple-secondary hover:text-apple-text">✕</Dialog.Close>
            </div>

            {previewingDraft && platform === "linkedin" && (
              <div className="rounded-xl border border-[#e0e0e0] bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm select-none">
                    {previewingDraft.headline?.charAt(0) ?? "A"}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1d1d1d]">Your Company</p>
                    <p className="text-xs text-[#666]">Just now · 🌐</p>
                  </div>
                </div>
                <p className="whitespace-pre-wrap text-sm text-[#1d1d1d] leading-relaxed">
                  {(previewingDraft.content_by_platform?.linkedin || previewingDraft.headline || "").slice(0, 600)}
                </p>
                <div className="mt-4 flex gap-4 border-t border-[#e0e0e0] pt-3 text-xs text-[#666]">
                  <span>👍 Like</span>
                  <span>💬 Comment</span>
                  <span>🔁 Repost</span>
                  <span>✉️ Send</span>
                </div>
              </div>
            )}

            {previewingDraft && platform === "x_twitter" && (
              <div className="rounded-xl border border-[#e1e8ed] bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-neutral-800 flex items-center justify-center text-white font-bold text-sm select-none">
                    {previewingDraft.headline?.charAt(0) ?? "A"}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#1d1d1d]">Your Company</p>
                    <p className="text-xs text-[#666]">@yourcompany</p>
                  </div>
                </div>
                <p className="whitespace-pre-wrap text-sm text-[#1d1d1d] leading-relaxed">
                  {(previewingDraft.content_by_platform?.x_twitter || previewingDraft.headline || "").slice(0, 280)}
                </p>
                <div className="mt-4 flex gap-5 text-xs text-[#657786]">
                  <span>💬 Reply</span>
                  <span>🔁 Repost</span>
                  <span>❤️ Like</span>
                  <span>📊 Views</span>
                </div>
              </div>
            )}

            {previewingDraft && !["linkedin", "x_twitter"].includes(platform) && (
              <div className="rounded-xl border border-apple-border bg-apple-bg p-4">
                <p className="text-sm font-semibold mb-2">{previewingDraft.headline}</p>
                <p className="whitespace-pre-wrap text-sm text-apple-secondary leading-relaxed">
                  {(previewingDraft.content_by_platform?.[platform] || previewingDraft.headline || "").slice(0, 500)}
                </p>
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Draft History Modal */}
      <Dialog.Root open={!!historyDraft} onOpenChange={(o) => { if (!o) { setHistoryDraft(null); setHistoryItems([]); } }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
          <Dialog.Content
            className="fixed left-1/2 top-1/2 z-60 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-apple bg-apple-card p-6 shadow-apple focus:outline-none"
            aria-modal
            aria-labelledby="history-modal-title"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 id="history-modal-title" className="text-sm font-semibold">Edit History</h3>
              <Dialog.Close className="rounded p-1 text-apple-secondary hover:text-apple-text">✕</Dialog.Close>
            </div>
            {historyLoading ? (
              <p className="text-sm text-apple-secondary">Loading…</p>
            ) : historyItems.length === 0 ? (
              <p className="text-sm text-apple-secondary">No saved versions yet. Edit and save a draft to create history.</p>
            ) : (
              <div className="space-y-3">
                {historyItems.map((item, i) => (
                  <div key={item.id ?? i} className="rounded-apple-sm border border-apple-border p-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-medium text-apple-secondary">
                        {new Date(item.saved_at).toLocaleString()}
                      </p>
                      <button
                        type="button"
                        className="text-xs text-apple-blue hover:underline"
                        onClick={() => {
                          if (historyDraft) {
                            setEditingDraft({ ...historyDraft, headline: item.headline, content_by_platform: item.content_by_platform });
                            setHistoryDraft(null);
                            setHistoryItems([]);
                          }
                        }}
                      >
                        Restore
                      </button>
                    </div>
                    <p className="text-xs text-apple-text truncate">{item.headline}</p>
                  </div>
                ))}
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* First-post celebration modal */}
      <Dialog.Root open={showFirstPostCelebration} onOpenChange={setShowFirstPostCelebration}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
          <Dialog.Content
            className="fixed left-1/2 top-1/2 z-50 w-[min(24rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-apple bg-apple-card p-8 shadow-apple-lg text-center"
            aria-modal="true"
            aria-labelledby="first-post-title"
          >
            <div className="mb-4 text-5xl" aria-hidden="true">🎉</div>
            <Dialog.Title id="first-post-title" className="text-lg font-semibold">
              Your first post is scheduled!
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-apple-secondary">
              Check back after 07:00 SGT to see it live on your connected platform.
            </Dialog.Description>
            <style>{`
              @keyframes confetti-pop {
                0% { opacity: 0; transform: scale(0.6) translateY(10px); }
                60% { opacity: 1; transform: scale(1.08) translateY(-4px); }
                100% { opacity: 1; transform: scale(1) translateY(0); }
              }
              [data-radix-dialog-content]:has(#first-post-title) {
                animation: confetti-pop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both;
              }
            `}</style>
            <button
              type="button"
              onClick={() => setShowFirstPostCelebration(false)}
              className="mt-6 w-full rounded-apple-sm bg-apple-blue px-4 py-2.5 text-sm font-medium text-white hover:bg-apple-blue-hover"
            >
              Got it
            </button>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}
