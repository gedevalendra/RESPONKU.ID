import { publicPageMetadata } from "@/lib/seo";
import BrandLogo from "@/app/components/layout/BrandLogo";
import { getAboutPage } from "@/lib/db";
import type { AboutSection } from "@/lib/about";
import { Reveal, ScrollProgress } from "@/app/components/about/AboutMotion";
import "./about.css";

const DESCRIPTION =
  "Kenali ResponKu, media digital Indonesia yang membuka ruang bagi pembaca untuk membaca, menulis, dan mengirim artikel.";

export const metadata = publicPageMetadata(
  "/tentang",
  "Tentang ResponKu — Media Digital Terbuka",
  DESCRIPTION
);

export const dynamic = "force-dynamic";

function Section({ section }: { section: AboutSection }) {
  const isHighlight = section.type === "highlight";

  return (
    <Reveal
      as="section"
      className={
        isHighlight
          ? "relative bg-blue-50 p-7 sm:p-10"
          : "relative pt-10"
      }
    >
      {isHighlight ? (
        <span
          aria-hidden="true"
          className="accent-grow absolute inset-y-0 left-0 w-1 bg-blue-500"
        />
      ) : (
        <span
          aria-hidden="true"
          className="rule-draw absolute inset-x-0 top-0 h-px bg-gray-300"
        />
      )}

      <p className="eyebrow">{section.eyebrow}</p>
      <h2 className="mt-3 max-w-[28ch] font-display text-2xl font-normal tracking-tight text-gray-800 sm:text-3xl lg:text-4xl">
        {section.title}
      </h2>

      {section.paragraphs.length > 0 && (
        <div className="mt-6 max-w-[68ch] space-y-5 text-gray-600">
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      )}

      {section.type === "cards" && (
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {(section.items || []).map((item, index) => (
            <Reveal
              key={item.id}
              as="article"
              delay={index * 90}
              className="about-card bg-white p-6 shadow-sm"
            >
              <span aria-hidden="true" className="card-bar" />
              <h3 className="font-display text-xl font-normal tracking-tight text-gray-800">
                {item.title}
              </h3>
              <p className="mt-3 text-base leading-relaxed text-gray-600">
                {item.text}
              </p>
            </Reveal>
          ))}
        </div>
      )}

      {section.type === "list" && (
        <ol className="mt-8 max-w-[68ch] divide-y divide-gray-200 border-y border-gray-200 text-gray-600">
          {(section.listItems || []).map((item, index) => (
            <Reveal
              key={item}
              as="li"
              delay={index * 80}
              className="about-list-item flex gap-5 py-4"
            >
              <span className="font-mono text-sm text-blue-500">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span>{item}</span>
            </Reveal>
          ))}
        </ol>
      )}
    </Reveal>
  );
}

const FACTS = [
  { label: "Didirikan", value: "17 November 2026" },
  { label: "Pendiri", value: "Gede Valendra" },
  { label: "Bagian dari", value: "FunikIn" },
  { label: "Kontribusi", value: "Gratis untuk semua" },
];

export default async function AboutPage() {
  const page = await getAboutPage();

  return (
    <>
      <ScrollProgress />
      <noscript>
        <style>{`.reveal,.hero-fade{opacity:1!important;transform:none!important}.hero-mask>span{transform:none!important}.rule-draw,.hero-rule,.accent-grow{transform:none!important}`}</style>
      </noscript>

      <div className="about-page wrap py-12 sm:py-16 lg:py-24">
        {/* Hero */}
        <header className="mb-16 sm:mb-20 lg:mb-28">
          <p
            className="eyebrow hero-fade"
            style={{ "--d": "0s" } as React.CSSProperties}
          >
            Tentang kami
          </p>
          <h1 className="mt-4 font-display text-5xl font-normal leading-[1.02] tracking-tight text-gray-800 sm:text-7xl lg:text-8xl">
            <span className="hero-mask">
              <span style={{ "--d": "0.1s" } as React.CSSProperties}>
                Tentang
              </span>
            </span>
            <span className="hero-mask">
              <span
                className="text-blue-500"
                style={{ "--d": "0.25s" } as React.CSSProperties}
              >
                ResponKu
              </span>
            </span>
          </h1>
          <p
            className="hero-fade mt-8 max-w-[52ch] text-lg leading-relaxed text-gray-600 sm:text-xl"
            style={{ "--d": "0.6s" } as React.CSSProperties}
          >
            {DESCRIPTION}
          </p>
          <div
            aria-hidden="true"
            className="hero-rule mt-12 h-px w-full bg-gray-300"
          />
        </header>

        <div className="grid gap-14 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.6fr)] lg:gap-20">
          <main className="space-y-16 text-base leading-relaxed sm:text-lg">
            {page.sections.map((section) => (
              <Section key={section.id} section={section} />
            ))}
          </main>

          <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
            <Reveal className="bg-gray-800 p-7 text-white sm:p-8">
              <BrandLogo light className="h-7" />
              <p className="mt-4 font-display text-3xl leading-tight">
                {page.sidebarTitle}
              </p>
              <dl className="mt-8 divide-y divide-white/10 font-mono text-xs">
                {FACTS.map((fact) => (
                  <div key={fact.label} className="py-3 first:pt-0 last:pb-0">
                    <dt className="text-gray-400">{fact.label}</dt>
                    <dd className="mt-1 text-white">{fact.value}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>

            <Reveal delay={120} className="bg-blue-50 p-7">
              <p className="eyebrow text-blue-600">Mulai berkontribusi</p>
              <h2 className="mt-3 font-display text-2xl text-gray-800">
                Punya cerita yang penting untuk diketahui?
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-gray-600">
                {page.sidebarText}
              </p>
              <a
                href="/akun/artikel"
                className="about-cta mt-5 inline-block bg-blue-500 px-4 py-3 font-mono text-xs uppercase tracking-widest2 text-white hover:bg-blue-600"
              >
                Buat artikel
              </a>
            </Reveal>
          </aside>
        </div>

        <Reveal
          as="footer"
          className="mt-24 border-t border-rule pt-8 text-sm leading-relaxed text-mute"
        >
          <p>
            <BrandLogo /> — bagian dari FunikIn. Didirikan oleh Gede Valendra
            pada 17 November 2026.
          </p>
          <p className="mt-2 max-w-[68ch]">
            Independensi, akurasi, keselamatan, dan kepentingan publik adalah
            tanggung jawab yang terus kami upayakan.
          </p>
        </Reveal>
      </div>
    </>
  );
}