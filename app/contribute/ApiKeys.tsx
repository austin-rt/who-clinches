'use client';

import { useState } from 'react';

type Feature = 'simulator' | 'ai-chat' | 'rag' | 'share' | 'caching' | 'alerts';

const FEATURES: { id: Feature; label: string }[] = [
  { id: 'simulator', label: 'Simulator' },
  { id: 'ai-chat', label: 'AI Chat' },
  { id: 'rag', label: 'RAG' },
  { id: 'share', label: 'Share Links' },
  { id: 'caching', label: 'Caching' },
  { id: 'alerts', label: 'Alerts' },
];

const API_KEYS: {
  name: string;
  url: string;
  description: string;
  features: Feature[];
  alwaysShow?: boolean;
}[] = [
  {
    name: 'CFBD API Key',
    url: 'https://collegefootballdata.com/key',
    description:
      'Free account — your key is on your account page. The free Patreon tier is enough for development.',
    features: [],
    alwaysShow: true,
  },
  {
    name: 'Neon Database URLs',
    url: 'https://console.neon.tech/',
    description:
      'Create a free Postgres project. You need both the pooled (DATABASE_URL) and direct (DIRECT_URL) connection strings.',
    features: ['share', 'ai-chat', 'rag'],
  },
  {
    name: 'Upstash Redis',
    url: 'https://console.upstash.com/',
    description:
      'Free Redis database for caching and rate limiting. Without this, the app skips caching — still works fine for development.',
    features: ['caching'],
  },
  {
    name: 'Anthropic API Key',
    url: 'https://console.anthropic.com/settings/keys',
    description: 'Powers the AI chat analyst.',
    features: ['ai-chat'],
  },
  {
    name: 'Voyage AI API Key',
    url: 'https://dash.voyageai.com/api-keys',
    description:
      'Generates embeddings for the RAG knowledge base. Requires a Neon database for vector storage.',
    features: ['rag'],
  },
  {
    name: 'Resend',
    url: 'https://resend.com/api-keys',
    description: 'CFBD API key usage alert emails.',
    features: ['alerts'],
  },
];

export default function ApiKeys() {
  const [active, setActive] = useState<Set<Feature>>(new Set());

  const toggle = (id: Feature) => {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filtered =
    active.size > 0
      ? API_KEYS.filter((k) => k.alwaysShow || k.features.some((f) => active.has(f)))
      : API_KEYS;

  return (
    <>
      <p className="text-base-content/40 mt-3 text-xs">
        Filter by the feature you&apos;re working on to see which keys you need.
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {FEATURES.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => toggle(f.id)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              active.has(f.id)
                ? 'bg-primary/10 border-primary text-primary'
                : 'text-base-content/60 border-stroke bg-base-100 hover:bg-base-300'
            }`}
          >
            {f.label}
          </button>
        ))}
        {active.size > 0 && (
          <button
            type="button"
            onClick={() => setActive(new Set())}
            className="text-base-content/40 hover:text-base-content/60 text-xs"
          >
            Clear all
          </button>
        )}
      </div>
      <div className="mt-4 space-y-3">
        {filtered.map((key) => (
          <a
            key={key.name}
            href={key.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-lg border border-stroke bg-base-100 p-4 transition-colors hover:bg-base-300"
          >
            <div className="flex items-center gap-2">
              <span className="font-semibold">{key.name}</span>
              {key.alwaysShow ? (
                <span className="bg-error/10 rounded px-1.5 py-0.5 text-[10px] font-medium text-error">
                  required
                </span>
              ) : (
                <div className="flex gap-1">
                  {key.features.map((f) => (
                    <span
                      key={f}
                      className="text-base-content/50 rounded bg-base-300 px-1.5 py-0.5 text-[10px] font-medium"
                    >
                      {FEATURES.find((feat) => feat.id === f)?.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <p className="text-base-content/60 mt-1 text-xs">{key.description}</p>
          </a>
        ))}
      </div>
    </>
  );
}
