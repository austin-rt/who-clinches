import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contribute - Who Clinches',
  description: 'Learn how to contribute to Who Clinches',
};

const REPO_URL = 'https://github.com/austin-rt/who-clinches';

const steps = [
  {
    number: 1,
    title: 'Find or file an issue',
    description:
      'Browse open issues for bugs or features you want to tackle. If you spot something new, open an issue first so we can discuss the approach.',
  },
  {
    number: 2,
    title: 'Fork and clone',
    description:
      'Fork the repository to your account, clone it locally, and install dependencies with npm install.',
  },
  {
    number: 3,
    title: 'Create a branch',
    description:
      'Branch off develop with a descriptive name. Make your changes, write tests if applicable, and commit with clear messages.',
  },
  {
    number: 4,
    title: 'Open a pull request',
    description:
      'Push your branch and open a PR against develop. Reference the issue number in your description so it links automatically.',
  },
];

const apiKeys = [
  {
    name: 'CFBD API Key',
    service: 'collegefootballdata.com',
    url: 'https://collegefootballdata.com/key',
    description:
      'Free account — your key is on your account page. The free Patreon tier is enough for development.',
    required: true,
  },
  {
    name: 'Neon Database URLs',
    service: 'neon.tech',
    url: 'https://neon.tech/',
    description:
      'Create a free Postgres project. You need both the pooled (DATABASE_URL) and direct (DIRECT_URL) connection strings from the dashboard.',
    required: true,
  },
  {
    name: 'Upstash Redis',
    service: 'upstash.com',
    url: 'https://console.upstash.com/',
    description:
      'Free Redis database for caching and rate limiting. Without this, the app skips caching — still works fine for development.',
    required: false,
  },
  {
    name: 'Resend (Email)',
    service: 'resend.com',
    url: 'https://resend.com/',
    description:
      'Only needed for CFBD API key usage alert emails. Skip this for most contributions.',
    required: false,
  },
];

export default function ContributePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold">Contribute</h1>
      <p className="mt-3 text-text-secondary">
        Who Clinches is open source and contributions are welcome. Whether it&apos;s fixing a bug,
        adding a feature, or improving documentation — every contribution helps.
      </p>

      <div className="mt-10 space-y-6">
        {steps.map((step) => (
          <div key={step.number} className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-white">
              {step.number}
            </div>
            <div>
              <h3 className="text-lg font-semibold">{step.title}</h3>
              <p className="mt-1 text-sm text-text-secondary">{step.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-lg border border-stroke bg-base-200 p-6">
        <h2 className="text-xl font-semibold">Getting Set Up</h2>
        <p className="mt-2 text-sm text-text-secondary">
          Copy <code className="rounded bg-base-300 px-1.5 py-0.5 text-xs">.env.example</code> to{' '}
          <code className="rounded bg-base-300 px-1.5 py-0.5 text-xs">.env.local</code> and fill in
          your API keys. Only the CFBD key and a Neon database are required to run locally.
        </p>
        <div className="mt-4 space-y-3">
          {apiKeys.map((key) => (
            <div
              key={key.name}
              className="flex items-start gap-3 rounded-lg border border-stroke bg-base-100 p-4"
            >
              <div
                className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${key.required ? 'bg-primary text-white' : 'bg-base-300 text-text-secondary'}`}
              >
                {key.required ? 'Required' : 'Optional'}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{key.name}</span>
                  <a
                    href={key.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary underline-offset-2 hover:underline dark:text-accent"
                  >
                    {key.service}
                  </a>
                </div>
                <p className="mt-0.5 text-xs text-text-secondary">{key.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-12 rounded-lg border border-stroke bg-base-200 p-6">
        <h2 className="text-xl font-semibold">Quick Links</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <QuickLink
            href={REPO_URL}
            title="Repository"
            description="View the source code"
            icon={<GitHubIcon />}
          />
          <QuickLink
            href={`${REPO_URL}/issues`}
            title="Issues"
            description="Browse bugs and feature requests"
            icon={<IssueIcon />}
          />
          <QuickLink
            href={`${REPO_URL}/issues/new?template=bug.yml`}
            title="Report a Bug"
            description="Found something broken? Let us know"
            icon={<BugIcon />}
          />
          <QuickLink
            href={`${REPO_URL}/issues/new?template=feature.yml`}
            title="Request a Feature"
            description="Have an idea? We'd love to hear it"
            icon={<FeatureIcon />}
          />
          <QuickLink
            href={`${REPO_URL}/pulls`}
            title="Pull Requests"
            description="See what's in progress"
            icon={<PRIcon />}
          />
          <QuickLink
            href={`${REPO_URL}/blob/main/CONTRIBUTING.md`}
            title="Contributing Guide"
            description="Full setup and workflow details"
            icon={<DocIcon />}
          />
        </div>
      </div>

      <div className="mt-12 rounded-lg border border-stroke bg-base-200 p-6">
        <h2 className="text-xl font-semibold">Tech Stack</h2>
        <p className="mt-2 text-sm text-text-secondary">
          Familiarity with any of these is helpful but not required — we&apos;re happy to help you
          get oriented.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            'Next.js',
            'TypeScript',
            'Tailwind CSS',
            'DaisyUI',
            'Redux Toolkit',
            'Prisma',
            'Neon (Postgres)',
            'Upstash (Redis)',
            'Vercel',
          ].map((tech) => (
            <span
              key={tech}
              className="rounded-full border border-stroke bg-base-100 px-3 py-1 text-xs font-medium"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

const QuickLink = ({
  href,
  title,
  description,
  icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-start gap-3 rounded-lg border border-stroke bg-base-100 p-4 transition-colors hover:bg-base-300"
  >
    <div className="mt-0.5 shrink-0 text-base-content">{icon}</div>
    <div>
      <div className="font-semibold">{title}</div>
      <div className="text-xs text-text-secondary">{description}</div>
    </div>
  </a>
);

const GitHubIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="h-5 w-5">
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
  </svg>
);

const IssueIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="h-5 w-5">
    <path d="M8 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
    <path
      fillRule="evenodd"
      d="M8 0a8 8 0 100 16A8 8 0 008 0zM1.5 8a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0z"
    />
  </svg>
);

const BugIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="h-5 w-5">
    <path
      fillRule="evenodd"
      d="M4.72.22a.75.75 0 011.06 0l1 1a.75.75 0 01-1.06 1.06l-.293-.293A3.01 3.01 0 004 4.257V4.5h8v-.243a3.01 3.01 0 00-1.427-2.27l-.293.293a.75.75 0 11-1.06-1.06l1-1a.75.75 0 011.06 0l.293.293A4.507 4.507 0 0113.5 4.5V5h1.25a.75.75 0 010 1.5H13.5v1h1.25a.75.75 0 010 1.5H13.5v1h1.25a.75.75 0 010 1.5H13.5v.5a4.5 4.5 0 01-9 0V11H3.25a.75.75 0 010-1.5H4.5V8.5H3.25a.75.75 0 010-1.5H4.5v-1H3.25a.75.75 0 010-1.5H4.5V5a4.507 4.507 0 011.927-3.707L6.72.22zM6 4.5V5h4v-.5a2.5 2.5 0 00-4 0zM6 12.5a2.5 2.5 0 005 0v-6H6v6z"
    />
  </svg>
);

const FeatureIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="h-5 w-5">
    <path
      fillRule="evenodd"
      d="M7.998 14.5c2.832 0 5-1.98 5-4.5 0-1.463-.68-2.19-1.879-3.383l-.036-.037C9.865 5.344 8.5 3.938 8.5 1.5a.5.5 0 00-1 0c0 2.438-1.365 3.844-2.583 5.08l-.036.037C3.678 7.81 2.998 8.537 2.998 10c0 2.52 2.168 4.5 5 4.5zm1.336-8.958C10.36 6.588 11.498 7.776 11.498 10c0 1.657-1.345 3-3.5 3S4.498 11.657 4.498 10c0-2.224 1.138-3.412 2.164-4.458.09-.09.178-.18.266-.27a7.66 7.66 0 00.07.072c.088.09.176.179.266.268z"
    />
  </svg>
);

const PRIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="h-5 w-5">
    <path
      fillRule="evenodd"
      d="M7.177 3.073L9.573.677A.25.25 0 0110 .854v4.792a.25.25 0 01-.427.177L7.177 3.427a.25.25 0 010-.354zM3.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122v5.256a2.251 2.251 0 11-1.5 0V5.372A2.25 2.25 0 011.5 3.25zM11 2.5h-1V4h1a1 1 0 011 1v5.628a2.251 2.251 0 101.5 0V5A2.5 2.5 0 0011 2.5zm1 10.25a.75.75 0 111.5 0 .75.75 0 01-1.5 0zM3.75 12a.75.75 0 100 1.5.75.75 0 000-1.5z"
    />
  </svg>
);

const DocIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="h-5 w-5">
    <path
      fillRule="evenodd"
      d="M0 1.75A.75.75 0 01.75 1h4.253c1.227 0 2.317.59 3 1.501A3.744 3.744 0 0111.006 1h4.245a.75.75 0 01.75.75v10.5a.75.75 0 01-.75.75h-4.507a2.25 2.25 0 00-1.591.659l-.622.621a.75.75 0 01-1.06 0l-.622-.621A2.25 2.25 0 005.258 13H.75a.75.75 0 01-.75-.75V1.75zm7.251 10.324V2.922A2.25 2.25 0 005.003 2.5H1.5v9h3.757a3.75 3.75 0 011.994.574zM8.755 12.074V2.922a2.25 2.25 0 012.248-.422H14.5v9h-3.757a3.75 3.75 0 00-1.988.574z"
    />
  </svg>
);
