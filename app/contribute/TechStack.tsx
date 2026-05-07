'use client';

import {
  SiNextdotjs,
  SiTypescript,
  SiTailwindcss,
  SiDaisyui,
  SiRedux,
  SiPrisma,
  SiPostgresql,
  SiRedis,
  SiVercel,
  SiHotjar,
  SiUpstash,
} from 'react-icons/si';
import type { IconType } from 'react-icons';
import { VscPulse } from 'react-icons/vsc';

const techStack: { name: string; url: string; icon: IconType }[] = [
  { name: 'TypeScript', url: 'https://www.typescriptlang.org/docs/', icon: SiTypescript },
  { name: 'Next.js', url: 'https://nextjs.org/docs', icon: SiNextdotjs },
  { name: 'Prisma', url: 'https://www.prisma.io/docs', icon: SiPrisma },
  { name: 'Neon', url: 'https://neon.tech/docs', icon: SiPostgresql },
  { name: 'Redis', url: 'https://redis.io/docs/', icon: SiRedis },
  { name: 'Upstash', url: 'https://upstash.com/docs/redis', icon: SiUpstash },
  { name: 'Redux Toolkit', url: 'https://redux-toolkit.js.org/', icon: SiRedux },
  { name: 'Tailwind CSS', url: 'https://tailwindcss.com/docs', icon: SiTailwindcss },
  { name: 'DaisyUI', url: 'https://daisyui.com/components/', icon: SiDaisyui },
  { name: 'Vercel', url: 'https://vercel.com/docs', icon: SiVercel },
  { name: 'Hotjar', url: 'https://www.hotjar.com/', icon: SiHotjar },
  { name: 'LogRocket', url: 'https://logrocket.com/', icon: VscPulse },
];

export default function TechStack() {
  return (
    <div className="mt-4 grid grid-cols-4 gap-4 sm:grid-cols-6">
      {techStack.map((tech) => {
        const Icon = tech.icon;
        return (
          <a
            key={tech.name}
            href={tech.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1.5 rounded-lg p-2 transition-colors hover:bg-base-300"
          >
            <Icon className="h-6 w-6 text-base-content" />
            <span className="text-center text-[10px] leading-tight text-text-secondary">
              {tech.name}
            </span>
          </a>
        );
      })}
    </div>
  );
}
