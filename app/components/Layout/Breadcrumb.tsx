'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface BreadcrumbSegment {
  label: string;
  href: string;
}

const buildSegments = (pathname: string): BreadcrumbSegment[] => {
  const parts = pathname.split('/').filter(Boolean);
  return [
    { label: 'HOME', href: '/' },
    ...parts.map((part, i) => ({
      label: part.toUpperCase(),
      href: '/' + parts.slice(0, i + 1).join('/'),
    })),
  ];
};

const Breadcrumb = () => {
  const pathname = usePathname();
  const segments = buildSegments(pathname);

  if (segments.length === 0) return null;

  return (
    <div className="border-b border-stroke-alt bg-base-100">
      <div className="container mx-auto px-4 py-2">
        <nav className="flex items-center gap-1.5 text-sm">
          {segments.map((seg, i) => {
            const isLast = i === segments.length - 1;
            return (
              <span key={seg.href} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-base-content/30">•</span>}
                {isLast ? (
                  <span className="font-medium text-base-content">{seg.label}</span>
                ) : (
                  <Link
                    href={seg.href}
                    className="text-base-content/60 transition-colors hover:text-base-content hover:underline"
                  >
                    {seg.label}
                  </Link>
                )}
              </span>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default Breadcrumb;
