import type { MainProductIconType } from '../../lib/mainProduct';

interface MainProductBadgeProps {
  iconType: MainProductIconType;
  label: string;
  tooltipPrefix: string;
  size?: 'sm' | 'md' | 'lg';
}

function ProductGlyph({ iconType }: { iconType: MainProductIconType }) {
  if (iconType === 'baby') {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 3h6v3H9z" />
        <path d="M12 6v4" />
        <rect x="8" y="10" width="8" height="10" rx="3" />
        <path d="M10 14h4" />
      </svg>
    );
  }

  if (iconType === 'dairy') {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 5h6l1 3v11H8V8z" />
        <path d="M9 5l3 2 3-2" />
        <path d="M10 13h4" />
      </svg>
    );
  }

  if (iconType === 'fish') {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 12c2.5-3 6-4.5 10-4l4 4-4 4c-4 .5-7.5-1-10-4z" />
        <path d="M18 12h2" />
        <circle cx="10" cy="11" r="0.9" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  if (iconType === 'seafood') {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M7 15c0-3 2-5 5-5s5 2 5 5" />
        <path d="M7 15c0 2 2 4 5 4s5-2 5-4" />
        <path d="M12 8V5" />
        <path d="M9 9 8 7" />
        <path d="M15 9l1-2" />
      </svg>
    );
  }

  if (iconType === 'dessert') {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 4c2 0 3 1.5 3 3.2S14 10 12 10s-3-1.2-3-2.8S10 4 12 4z" />
        <path d="M9 10h6l-1 2.5H10z" />
        <path d="M10 12.5 8 20h8l-2-7.5" />
      </svg>
    );
  }

  if (iconType === 'pastry') {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 14c1.5-3 4-4.5 7-4.5S17.5 11 19 14" />
        <path d="M4 14h16v5H4z" />
        <path d="M8 14v5" />
        <path d="M12 14v5" />
        <path d="M16 14v5" />
      </svg>
    );
  }

  if (iconType === 'egg') {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 4c3 0 5 3.7 5 7.3C17 15.5 14.8 19 12 19s-5-3.5-5-7.7C7 7.7 9 4 12 4z" />
      </svg>
    );
  }

  if (iconType === 'offal') {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M8 8c0-2 1.6-3 3-3s2.5.8 3 2c.7-.4 1.4-.6 2.2-.6 2.1 0 3.8 1.7 3.8 3.8 0 3.2-2.7 6.8-8 8.8-5.3-2-8-5.6-8-8.8C4 8.1 5.7 6.4 7.8 6.4 8 6.4 8 6.4 8 6.4z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 8c0-2.2 1.8-4 4-4h6" />
      <path d="M10 4v4" />
      <path d="M8 12h11a2 2 0 0 1 0 4H8a3 3 0 0 1 0-6z" />
      <circle cx="7" cy="13" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function toneClasses(iconType: MainProductIconType): string {
  if (iconType === 'baby') return 'border-cyan-300 bg-cyan-50 text-cyan-700';
  if (iconType === 'dairy') return 'border-indigo-300 bg-indigo-50 text-indigo-700';
  if (iconType === 'fish') return 'border-sky-300 bg-sky-50 text-sky-700';
  if (iconType === 'seafood') return 'border-teal-300 bg-teal-50 text-teal-700';
  if (iconType === 'dessert') return 'border-pink-300 bg-pink-50 text-pink-700';
  if (iconType === 'pastry') return 'border-amber-300 bg-amber-50 text-amber-700';
  if (iconType === 'egg') return 'border-yellow-300 bg-yellow-50 text-yellow-700';
  if (iconType === 'offal') return 'border-rose-300 bg-rose-50 text-rose-700';
  return 'border-emerald-300 bg-emerald-50 text-emerald-700';
}

function sizeClasses(size: MainProductBadgeProps['size']): string {
  if (size === 'lg') {
    return 'h-12 w-12';
  }

  if (size === 'md') {
    return 'h-10 w-10';
  }

  return 'h-8 w-8';
}

export function MainProductBadge({ iconType, label, tooltipPrefix, size = 'sm' }: MainProductBadgeProps) {
  return (
    <span
      aria-label={`${tooltipPrefix}: ${label}`}
      className={`instant-tooltip inline-flex items-center justify-center rounded-full border shadow-sm ${sizeClasses(size)} ${toneClasses(iconType)}`}
      data-tooltip={`${tooltipPrefix}: ${label}`}
    >
      <ProductGlyph iconType={iconType} />
    </span>
  );
}
