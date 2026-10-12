"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiGet, getImageUrl } from "@/lib/api-client";

interface BannerItem {
  id: string;
  title: string;
  subtitle?: string | null;
  imageUrl: string;
  linkUrl?: string | null;
}

const defaultSlides: BannerItem[] = [
  { id: '1', title: 'Mega Sale: Up to 50% Off Genuine Displays', subtitle: 'Guaranteed OEM parts with warranty', imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1400&q=80', linkUrl: '/category/all' },
  { id: '2', title: 'Original Batteries & Charging Logic Spares', subtitle: 'Fast nationwide doorstep delivery', imageUrl: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=1400&q=80', linkUrl: '/category/all' },
  { id: '3', title: 'Free Shipping Across Bangladesh on Orders Over ৳5000', subtitle: 'Express 24-48h dispatch', imageUrl: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=1400&q=80', linkUrl: '/category/all' },
];

export function HeroCarousel() {
  const [slides, setSlides] = useState<BannerItem[]>(defaultSlides);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiGet<BannerItem[]>('/banners/active');
        if (data && data.length > 0) {
          setSlides(data);
        }
      } catch (e) {
        console.error('Failed to load active banners:', e);
      }
    })();
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  if (!slides || slides.length === 0) return null;

  return (
    <div className="relative w-full aspect-[21/9] md:aspect-[3/1] rounded-2xl overflow-hidden group shadow-sm bg-slate-900">
      {/* Slides */}
      <div 
        className="flex w-full h-full transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {slides.map((slide) => {
          const content = (
            <div key={slide.id} className="w-full h-full shrink-0 relative flex items-center justify-start overflow-hidden">
              <img 
                src={getImageUrl(slide.imageUrl)} 
                alt={slide.title} 
                className="absolute inset-0 w-full h-full object-cover brightness-[0.75]" 
              />
              <div className="relative z-10 p-6 md:p-12 max-w-xl text-white space-y-2">
                <span className="inline-block px-3 py-1 bg-emerald-600/90 text-white rounded-full text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
                  Special Offer
                </span>
                <h2 className="text-xl md:text-3xl font-extrabold tracking-tight drop-shadow-md leading-tight">
                  {slide.title}
                </h2>
                {slide.subtitle && (
                  <p className="text-xs md:text-sm text-slate-200 line-clamp-2 drop-shadow">
                    {slide.subtitle}
                  </p>
                )}
              </div>
            </div>
          );

          if (slide.linkUrl) {
            return (
              <Link key={slide.id} href={slide.linkUrl} className="w-full h-full shrink-0 block">
                {content}
              </Link>
            );
          }
          return content;
        })}
      </div>

      {/* Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <Button 
            variant="secondary" 
            size="icon" 
            onClick={(e) => { e.preventDefault(); prevSlide(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 hover:bg-white text-slate-800 rounded-full w-10 h-10 shadow-sm z-20"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button 
            variant="secondary" 
            size="icon" 
            onClick={(e) => { e.preventDefault(); nextSlide(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 hover:bg-white text-slate-800 rounded-full w-10 h-10 shadow-sm z-20"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>

          {/* Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-2 rounded-full transition-all ${currentSlide === index ? 'bg-emerald-400 w-6' : 'bg-white/50 hover:bg-white/80 w-2'}`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
