"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
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

function OfferCard({ offer }: { offer: PublicOffer }) {
  return (
    <article className={styles.offerCard}>
      <div>
        {offer.categories.length > 0 && (
          <div className={styles.offerTags} aria-label="Categorías laborales">
            {offer.categories.slice(0, 2).map(category => (
              <Badge key={category.id} variant="secondary">
                <span className={styles.offerTagLabel}>{category.name}</span>
              </Badge>
            ))}
          </div>
        )}
        <h3 className={styles.offerCardTitle}>
          <Link href={`/ofertas/${offer.slug}`}>{offer.title}</Link>
        </h3>
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

export function HomeOffersCarousel({ offers }: { offers: PublicOffer[] }) {
  const [vertical, setVertical] = useState(false);
  const [api, setApi] = useState<CarouselApi | null>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const [active, setActive] = useState(0);

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
      <OfferCard offer={offer} />
    </CarouselItem>
  ));

  if (vertical) {
    return (
      <div className={styles.carouselVertical}>
        <Carousel
          key="vertical"
          orientation="vertical"
          setApi={setApi}
          opts={{ align: "start", containScroll: "trimSnaps", slidesToScroll: 1 }}
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
    );
  }

  const count = offers.length;
  const half = Math.floor(count / 2);

  return (
    <div className={styles.carouselHorizontal}>
      <button type="button" onClick={() => setActive(value => (value - 1 + count) % count)} aria-label="Anterior" className={styles.carouselButton}>
        <ChevronLeft aria-hidden="true" />
      </button>
      <div className={styles.coverflow}>
        {offers.map((offer, index) => {
          const distance = (((active - index + half) % count) + count) % count - half;
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
              <OfferCard offer={offer} />
            </div>
          );
        })}
      </div>
      <button type="button" onClick={() => setActive(value => (value + 1) % count)} aria-label="Siguiente" className={styles.carouselButton}>
        <ChevronRight aria-hidden="true" />
      </button>
    </div>
  );
}
