"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

type ClientRow = { tenant_id: string; company_name: string; subscription_tier?: string };

export default function AgencyDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || authLoading) return;
    let cancelled = false;
    setLoading(true);
    apiFetch<{ clients?: ClientRow[] }>("/api/agency/overview")
      .then((d) => {
        if (!cancelled) setClients(d.clients || []);
      })
      .catch((e) => {
        if (!cancelled) setLoadError(e?.message || "Unable to load agency data.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-apple-bg">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-apple-text border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-apple-bg p-6 sm:p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="rounded-apple border border-amber-200 bg-amber-50 p-4 text-center">
          <p className="text-sm font-medium text-amber-800">
            Agency mode lists other workspaces on your account. White-label and client portals ship in a later
            milestone.{" "}
            <Link href="/dashboard" className="text-apple-blue hover:underline">
              Main dashboard
            </Link>
          </p>
        </div>

        <div className="rounded-apple bg-apple-card p-6 shadow-apple">
          <h1 className="text-xl font-semibold text-apple-text">Client workspaces</h1>
          <p className="mt-1 text-sm text-apple-secondary">
            Tenants sharing your login, optionally linked with{" "}
            <code className="rounded bg-apple-bg px-1 text-xs">agency_parent_tenant_id</code>.
          </p>
          {loading && <p className="mt-4 text-sm text-apple-secondary">Loading…</p>}
          {loadError && <p className="mt-4 text-sm text-red-600">{loadError}</p>}
          {!loading && !loadError && clients.length === 0 && (
            <p className="mt-4 text-sm text-apple-secondary">
              No additional client workspaces found. Create another tenant from onboarding with the same account, or
              set <code className="rounded bg-apple-bg px-1 text-xs">agency_parent_tenant_id</code> on client tenant
              documents.
            </p>
          )}
          {!loading && clients.length > 0 && (
            <ul className="mt-4 divide-y divide-apple-border border border-apple-border rounded-apple-sm">
              {clients.map((c) => (
                <li key={c.tenant_id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium text-apple-text">{c.company_name || c.tenant_id}</p>
                    <p className="text-xs text-apple-secondary">{c.tenant_id}</p>
                  </div>
                  <span className="rounded-full bg-apple-bg px-2 py-0.5 text-xs text-apple-secondary">
                    {c.subscription_tier || "starter"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
