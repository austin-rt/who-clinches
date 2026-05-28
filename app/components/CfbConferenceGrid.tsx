import Link from 'next/link';
import Image from 'next/image';
import {
  CFB_AVAILABLE_CONFERENCES,
  CFB_CONFERENCE_METADATA,
  type CFBConferenceAbbreviation,
} from '@/lib/cfb/constants';

const CFB_CONFERENCE_LOGOS: Record<string, string> = {
  sec: '/logos/conferences/sec.svg',
  acc: '/logos/conferences/acc.svg',
  b1g: '/logos/conferences/b1g.svg',
  big12: '/logos/conferences/b12.svg',
  pac: '/logos/conferences/pac.svg',
  aac: '/logos/conferences/aac.svg',
  mac: '/logos/conferences/mac.svg',
  cusa: '/logos/conferences/cusa.svg',
  mwc: '/logos/conferences/mwc.svg',
  sunbelt: '/logos/conferences/sbc.svg',
};

const CfbConferenceGrid = () => (
  <div
    data-testid="conference-grid"
    className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5"
  >
    {CFB_AVAILABLE_CONFERENCES.map((conf) => {
      const meta = CFB_CONFERENCE_METADATA[conf as CFBConferenceAbbreviation];
      const logo = CFB_CONFERENCE_LOGOS[conf];
      return (
        <Link
          key={conf}
          href={`/cfb/${conf}`}
          data-testid={`conf-card-${conf}`}
          className="group flex flex-col items-center gap-2 rounded-xl border border-black/5 bg-gradient-to-b from-white to-black/[0.02] p-3 backdrop-blur-sm transition-all hover:from-black/[0.02] hover:to-black/[0.05] dark:border-white/10 dark:from-white/20 dark:to-white/15 dark:hover:from-white/25 dark:hover:to-white/20"
        >
          {logo ? (
            <div className="flex h-24 w-full items-center justify-center">
              <Image
                src={logo}
                alt={meta.name}
                width={120}
                height={120}
                unoptimized
                className="h-auto max-h-full w-auto max-w-full object-contain"
              />
            </div>
          ) : (
            <div className="text-base-content/50 flex aspect-square w-full items-center justify-center rounded-full bg-base-200 text-xs font-bold">
              {meta.cfbdId}
            </div>
          )}
          <span className="text-base-content/70 text-sm font-medium group-hover:text-base-content">
            {meta.name}
          </span>
        </Link>
      );
    })}
  </div>
);

export default CfbConferenceGrid;
