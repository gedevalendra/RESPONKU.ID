self.addEventListener("push", (event) => {
  const payload = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(payload.title || "ResponKu", {
      body: payload.body || "Ada informasi terbaru dari ResponKu.",
      data: { href: payload.href || "/notifikasi" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data?.href || "/notifikasi"));
});
