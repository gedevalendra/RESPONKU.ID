self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {};
  }
  const thumbnail = typeof payload.image === "string" && payload.image.startsWith("https://")
    ? payload.image
    : undefined;
  event.waitUntil(
    self.registration.showNotification(payload.title || "ResponKu", {
      body: payload.body || "Ada informasi terbaru dari ResponKu.",
      icon: "https://www.responku.id/favicon.ico",
      image: thumbnail,
      badge: "https://www.responku.id/favicon.ico",
      data: { href: payload.href || "/notifikasi" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data?.href || "/notifikasi"));
});
