import { getAboutPage } from "@/lib/db";
import type { AboutSection } from "@/lib/about";

export const dynamic = "force-dynamic";

function Section({ section }: { section: AboutSection }) {
  const wrapper = section.type === "highlight" ? "bg-blue-50 p-7 sm:p-10" : "";
  return (
    <section className={wrapper}>
      <p className="eyebrow">{section.eyebrow}</p>
      <h2 className="mt-3 font-display text-2xl font-normal tracking-tight text-gray-800 sm:text-3xl">
        {section.title}
      </h2>
      {section.paragraphs.length > 0 && (
        <div className="mt-6 space-y-5 text-gray-600">
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      )}
      {section.type === "cards" && (
        <div className="mt-6 grid gap-8 sm:grid-cols-2">
          {(section.items || []).map((item, index) => (
            <article key={item.id} className="bg-white p-5 shadow-sm">
              <span className="font-mono text-sm text-blue-500">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-3 font-display text-xl font-normal tracking-tight text-gray-800">
                {item.title}
              </h3>
              <p className="mt-3 text-base leading-relaxed text-gray-600">
                {item.text}
              </p>
            </article>
          ))}
        </div>
      )}
      {section.type === "list" && (
        <ol className="mt-6 space-y-4 text-gray-600">
          {(section.listItems || []).map((item, index) => (
            <li key={item} className="flex gap-4">
              <span className="font-mono text-sm text-blue-500">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export default async function AboutPage() {
  const page = await getAboutPage();
  return (
    <div className="about-page wrap py-12 sm:py-16 lg:py-24">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1.4fr)_minmax(260px,0.6fr)] lg:gap-20">
        <main className="space-y-14 text-base leading-relaxed sm:text-lg">
          {page.sections.map((section) => (
            <Section key={section.id} section={section} />
          ))}
        </main>
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="bg-gray-800 p-7 text-white sm:p-8">
            <p className="eyebrow text-gray-300">ResponKu</p>
            <p className="mt-4 font-display text-3xl leading-tight">
              {page.sidebarTitle}
            </p>
            <dl className="mt-8 space-y-5 font-mono text-xs">
              <div>
                <dt className="text-gray-400">Didirikan</dt>
                <dd className="mt-1 text-white">17 November 2026</dd>
              </div>
              <div>
                <dt className="text-gray-400">Pendiri</dt>
                <dd className="mt-1 text-white">Gede Valendra</dd>
              </div>
              <div>
                <dt className="text-gray-400">Bagian dari</dt>
                <dd className="mt-1 text-white">FunikIn</dd>
              </div>
              <div>
                <dt className="text-gray-400">Kontribusi</dt>
                <dd className="mt-1 text-white">Gratis untuk semua</dd>
              </div>
            </dl>
          </div>
          <div className="mt-6 bg-blue-50 p-7">
            <p className="eyebrow text-blue-600">Mulai berkontribusi</p>
            <h2 className="mt-3 font-display text-2xl text-gray-800">
              Punya cerita yang penting untuk diketahui?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              {page.sidebarText}
            </p>
            <a
              href="/akun/artikel"
              className="mt-5 inline-block bg-blue-500 px-4 py-3 font-mono text-xs uppercase tracking-widest2 text-white hover:bg-blue-600"
            >
              Buat artikel
            </a>
          </div>
        </aside>
      </div>
      <footer className="mt-20 border-t border-rule pt-8 text-sm leading-relaxed text-mute">
        <p>
          ResponKu — bagian dari FunikIn. Didirikan oleh Gede Valendra pada 17
          November 2026.
        </p>
        <p className="mt-2">
          Independensi, akurasi, keselamatan, dan kepentingan publik adalah
          tanggung jawab yang terus kami upayakan.
        </p>
      </footer>
    </div>
  );
}
