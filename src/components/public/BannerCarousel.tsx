"use client";

import Link from "next/link";
import { useState } from "react";
import { MaterialIcon } from "@/components/public/MaterialIcon";
import { ShowCodeButton } from "@/components/public/ShowCodeButton";
import { cn } from "@/lib/ui/cn";

export type BannerSlide = {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  ctaLabel: string;
  isSponsored: boolean;
  isExclusive?: boolean;
  href: string | null;
  code: string | null;
  goHref: string | null;
};

export function BannerCarousel({ slides }: { slides: BannerSlide[] }) {
  const [index, setIndex] = useState(0);

  if (slides.length === 0) {
    return null;
  }

  const count = slides.length;
  const multi = count > 1;
  const slide = slides[index]!;
  const position = index + 1;
  const counterLabel = slide.isSponsored
    ? `Sponsored • ${position} of ${count}`
    : `${position} of ${count}`;

  const goPrev = () => setIndex((i) => (i - 1 + count) % count);
  const goNext = () => setIndex((i) => (i + 1) % count);

  return (
    <section aria-label="Featured banners">
      <div className="mb-2 flex items-center justify-between gap-3 px-1 text-xs text-on-surface-variant">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <MaterialIcon name="stars" filled size={15} className="text-[var(--urgency)]" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface">
            Featured Partner Deal
          </span>
          {slide.isExclusive ? (
            <span className="ml-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
              Verified Exclusive
            </span>
          ) : null}
        </div>
        {multi ? (
          <span className="shrink-0 text-[11px] font-medium text-on-surface-variant">{counterLabel}</span>
        ) : slide.isSponsored ? (
          <span className="shrink-0 text-[11px] font-medium text-on-surface-variant">Sponsored</span>
        ) : null}
      </div>

      <div className="group relative w-full overflow-hidden rounded-2xl bg-black shadow-[var(--shadow-card)] transition-shadow hover:shadow-md">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={slide.imageUrl}
          alt={slide.title}
          className="block min-h-[14rem] w-full object-cover md:min-h-[18rem]"
        />

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent p-5 pt-16">
          <h2 className="text-xl font-bold text-white">{slide.title}</h2>
          {slide.subtitle ? <p className="mt-1 text-sm text-white/75">{slide.subtitle}</p> : null}
          <div className="mt-3 max-w-md">
            {slide.goHref ? (
              <ShowCodeButton code={slide.code} goHref={slide.goHref} label={slide.ctaLabel} />
            ) : slide.href ? (
              <Link
                href={slide.href}
                className="inline-flex h-12 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-on-primary hover:bg-[var(--primary-hover)]"
              >
                {slide.ctaLabel}
              </Link>
            ) : null}
          </div>
        </div>

        {multi ? (
          <>
            <button
              type="button"
              aria-label="Previous slide"
              className="banner-carousel-prev absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-900 opacity-80 shadow-md transition-all hover:bg-white group-hover:opacity-100"
              onClick={goPrev}
            >
              <MaterialIcon name="chevron_left" size={20} />
            </button>
            <button
              type="button"
              aria-label="Next slide"
              className="banner-carousel-next absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-900 opacity-80 shadow-md transition-all hover:bg-white group-hover:opacity-100"
              onClick={goNext}
            >
              <MaterialIcon name="chevron_right" size={20} />
            </button>
            <div
              className="banner-carousel-dots absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 backdrop-blur-sm"
              role="tablist"
              aria-label="Banner slides"
            >
              {slides.map((s, dotIndex) => (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={dotIndex === index}
                  aria-label={`Go to slide ${dotIndex + 1}`}
                  className={cn(
                    "h-2 w-2 rounded-full transition-all",
                    dotIndex === index ? "bg-white" : "bg-white/50 hover:bg-white/80",
                  )}
                  onClick={() => setIndex(dotIndex)}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
