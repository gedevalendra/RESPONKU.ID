export default function Loading() {
  return (
    <div
      role="status"
      className="mx-auto grid min-h-[55dvh] max-w-wrap place-items-center px-5 py-12"
    >
      <div className="flex items-center gap-3 text-sm text-mute">
        <span
          aria-hidden="true"
          className="size-5 shrink-0 rounded-full border-2 border-rule border-t-accent motion-safe:animate-spin"
        />
        <span>Memuat halaman…</span>
      </div>
    </div>
  );
}
