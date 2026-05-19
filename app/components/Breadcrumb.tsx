'use client';

import { usePathname } from 'next/navigation';
import { SPORT_METADATA, getConferenceMetadata, type SportSlug } from '@/lib/constants';

const STATIC_LABELS: Record<string, string> = {
  contribute: 'Contribute',
  results: 'Results',
  admin: 'Admin',
};

const buildSegmentLabels = (pathname: string): string[] => {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return [];

  return segments.map((segment) => {
    const sportMeta = SPORT_METADATA[segment as SportSlug];
    if (sportMeta) return sportMeta.name;
    if (STATIC_LABELS[segment]) return STATIC_LABELS[segment];
    const confMeta = getConferenceMetadata(segment);
    if (confMeta) return confMeta.name;
    return segment.charAt(0).toUpperCase() + segment.slice(1);
  });
};

const Breadcrumb = () => {
  const pathname = usePathname();
  const labels = buildSegmentLabels(pathname);

  if (labels.length === 0) return null;

  return (
    <div className="border-b border-stroke-alt bg-base-100">
      <div className="container mx-auto px-4 py-2">
        <p className="text-sm text-base-content">{labels.join(' • ')}</p>
      </div>
    </div>
  );
};

export default Breadcrumb;
