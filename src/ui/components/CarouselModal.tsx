import { useRef, useEffect } from 'react';

export interface CarouselItem {
  id: string;
  icon: JSX.Element;
  title: string;
  meta: string;
  detail?: string;
}

export interface CarouselModalProps {
  items: readonly CarouselItem[];
  initialIndex: number;
  onClose: () => void;
}

export function CarouselModal({
  items,
  initialIndex,
  onClose,
}: CarouselModalProps): JSX.Element {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const cardWidth = 340;
      const gap = 16;
      scrollRef.current.scrollLeft = initialIndex * (cardWidth + gap);
    }
  }, [initialIndex]);

  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => { document.removeEventListener('keydown', handler); };
  }, [onClose]);

  return (
    <div className="carousel-overlay" onClick={onClose}>
      <div className="carousel-container" onClick={(e): void => { e.stopPropagation(); }}>
        <button type="button" className="carousel-close" onClick={onClose}>
          &times;
        </button>
        <div className="carousel-dots">
          {items.map((_, i) => (
            <span
              key={String(i)}
              className={`carousel-dot${i === initialIndex ? ' active' : ''}`}
            />
          ))}
        </div>
        <div className="carousel-scroll" ref={scrollRef}>
          {items.map((item) => (
            <div key={item.id} className="carousel-card">
              <div className="carousel-card-header">
                <span className="carousel-card-icon">{item.icon}</span>
                <h3 className="carousel-card-title">{item.title}</h3>
              </div>
              {item.detail !== undefined && (
                <p className="carousel-card-detail">{item.detail}</p>
              )}
              <p className="carousel-card-meta">{item.meta}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
