"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { CategoryLabel } from "@/components/job-category-label";
import { BriefcaseBusiness, Building2, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { Badge } from "@/components/ui";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { formatPublicClosingDate, publicModalityLabel } from "@/features/openings/public-offer-display";
import type { PublicOffer } from "@/features/openings/public-service";
import styles from "./home.module.css";

function OfferCard({ offer, heading: Heading }: { offer: PublicOffer; heading: "h2" | "h3" }) {
  return (
    <article className={styles.offerCard}>
      <div>
        {offer.categories.length > 0 && (
          <div className={styles.offerTags} aria-label="Categorías laborales">
            {offer.categories.slice(0, 2).map(category => (
              <Badge key={category.id} variant="secondary">
                <CategoryLabel className={styles.offerTagLabel} name={category.name} />
              </Badge>
            ))}
          </div>
        )}
        <Heading className={styles.offerCardTitle}>
          <Link href={`/ofertas/${offer.slug}`}>{offer.title}</Link>
        </Heading>
        <p className={styles.offerCompany}>
          <Building2 aria-hidden="true" />
          <span className={styles.offerCompanyName}>{offer.company_name}</span>
        </p>
      </div>
      <div className={styles.offerCardMeta}>
        <p className={styles.offerMeta}>
          <MapPin aria-hidden="true" />
          <span>{offer.location} · {publicModalityLabel(offer.modality)}</span>
        </p>
        <p className={styles.offerMeta}>
          <BriefcaseBusiness aria-hidden="true" />
          <span>{offer.vacancies} vacante{offer.vacancies === 1 ? "" : "s"} · Cierre: {formatPublicClosingDate(offer.closing_date)}</span>
        </p>
      </div>
    </article>
  );
}

export function HomeOffersCarousel({ offers, headingLevel = "h3" }: { offers: PublicOffer[]; headingLevel?: "h2" | "h3" }) {
  const [vertical, setVertical] = useState(false);
  const [api, setApi] = useState<CarouselApi | null>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const [active, setActive] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const query = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!query) return;
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (offers.length < 2 || reducedMotion || focused || hovered || (vertical && !api)) return;
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      if (vertical && api) {
        if (api.canScrollNext()) api.scrollNext();
        else api.scrollTo(0);
      } else setActive(value => (value + 1) % offers.length);
    }, 3000);
    return () => window.clearInterval(timer);
  }, [api, focused, hovered, offers.length, reducedMotion, vertical]);

  useEffect(() => {
    const query = window.matchMedia?.("(max-width: 767px)");
    if (!query) return;
    const update = () => setVertical(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!api) return;
    const update = () => {
      setCanPrev(api.canScrollPrev());
      setCanNext(api.canScrollNext());
    };
    update();
    api.on("select", update);
    api.on("reInit", update);
    return () => {
      api.off("select", update);
      api.off("reInit", update);
    };
  }, [api]);

  const slides = offers.map(offer => (
    <CarouselItem key={offer.id}>
      <OfferCard offer={offer} heading={headingLevel} />
    </CarouselItem>
  ));

  const count = offers.length;
  const content = vertical ? (
      <div className={styles.carouselVertical}>
        <Carousel
          key="vertical"
          orientation="vertical"
          setApi={setApi}
          opts={{ align: "start", containScroll: "trimSnaps", slidesToScroll: 1, loop: true }}
          className={styles.offersCarousel}
        >
          <CarouselContent className={styles.carouselContentVertical}>{slides}</CarouselContent>
        </Carousel>
        <div className={styles.carouselControls}>
          <button type="button" onClick={() => api?.scrollPrev()} disabled={!canPrev} aria-label="Anterior" className={styles.carouselButton}>
            <ChevronLeft aria-hidden="true" />
          </button>
          <button type="button" onClick={() => api?.scrollNext()} disabled={!canNext} aria-label="Siguiente" className={styles.carouselButton}>
            <ChevronRight aria-hidden="true" />
          </button>
        </div>
      </div>
    ) : (
    <div className={styles.carouselHorizontal}>
      <button type="button" onClick={() => setActive(value => (value + count - 1) % count)} disabled={count < 2} aria-label="Anterior" className={styles.carouselButton}>
        <ChevronLeft aria-hidden="true" />
      </button>
      <div className={styles.coverflow}>
        {offers.map((offer, index) => {
          const half = Math.floor(count / 2);
          const distance = (active - index + count + half) % count - half;
          const hidden = Math.abs(distance) > 2;
          return (
            <div
              key={offer.id}
              className={styles.coverflowCard}
              data-slot="coverflow-card"
              style={{ "--r": distance, opacity: hidden ? 0 : 1 } as CSSProperties}
              inert={hidden}
              aria-hidden={hidden}
            >
              <OfferCard offer={offer} heading={headingLevel} />
            </div>
          );
        })}
      </div>
      <button type="button" onClick={() => setActive(value => (value + 1) % count)} disabled={count < 2} aria-label="Siguiente" className={styles.carouselButton}>
        <ChevronRight aria-hidden="true" />
      </button>
    </div>
  );

  return <section aria-label="Carrusel de ofertas recientes" aria-live="off"
    onPointerEnter={event => { if (event.pointerType === "mouse") setHovered(true); }}
    onPointerLeave={() => setHovered(false)}
    onFocusCapture={() => setFocused(true)}
    onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
    {content}
  </section>;
}
