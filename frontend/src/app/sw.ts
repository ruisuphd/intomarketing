/// <reference types="@serwist/next/typings" />

import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

// Push notification handlers — must be registered before serwist.addEventListeners()
self.addEventListener("push", (event) => {
  const data = event.data?.json() as { title?: string; body?: string; sectionId?: string } | undefined;
  const title = data?.title ?? "IntoMarketing";
  const body = data?.body ?? "You have a new notification.";
  const sectionId = data?.sectionId ?? "overview";
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { sectionId },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const sectionId = (event.notification.data as { sectionId?: string })?.sectionId ?? "overview";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        const existing = clients.find((c) => c.url.includes("/dashboard"));
        if (existing) {
          void existing.focus();
          void existing.navigate(`/dashboard#${sectionId}`);
        } else {
          void self.clients.openWindow(`/dashboard#${sectionId}`);
        }
      })
  );
});

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  fallbacks: {
    entries: [
      {
        url: "/~offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();
