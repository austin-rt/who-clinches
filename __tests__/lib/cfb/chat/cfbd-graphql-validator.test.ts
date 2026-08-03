import {
  validateAiGraphqlQuery,
  MAX_ROOT_FIELDS,
  MAX_ROOT_LIMIT,
  MAX_DEPTH,
  MAX_QUERY_CHARS,
} from '@/lib/cfb/chat/cfbd-graphql-validator';

const valid = '{ game(where: {season: {_eq: 2025}}, limit: 25) { id homeTeam awayTeam } }';

describe('validateAiGraphqlQuery', () => {
  it('accepts a bounded query against an allowed root', () => {
    expect(validateAiGraphqlQuery(valid)).toEqual({ ok: true, rootFields: ['game'] });
  });

  it('rejects a mutation even though the schema exposes none', () => {
    const result = validateAiGraphqlQuery('mutation { game(limit: 1) { id } }');

    expect(result.ok).toBe(false);
    expect(result.reason).toContain('query operations');
  });

  it('rejects a subscription', () => {
    const result = validateAiGraphqlQuery('subscription { game(limit: 1) { id } }');

    expect(result.ok).toBe(false);
    expect(result.reason).toContain('query operations');
  });

  it('rejects runtime introspection', () => {
    const result = validateAiGraphqlQuery('{ __schema { types { name } } }');

    expect(result.ok).toBe(false);
    expect(result.reason).toContain('Introspection');
  });

  it('rejects a root field outside the allowlist', () => {
    const result = validateAiGraphqlQuery('{ athlete(limit: 5) { id } }');

    expect(result.ok).toBe(false);
    expect(result.reason).toContain('not available');
  });

  it('rejects alias batching beyond the root field cap', () => {
    const result = validateAiGraphqlQuery(
      '{ a: game(limit: 5) { id } b: game(limit: 5) { id } c: game(limit: 5) { id } }'
    );

    expect(result.ok).toBe(false);
    expect(result.reason).toContain(String(MAX_ROOT_FIELDS));
  });

  it('requires a literal limit on every root field', () => {
    const result = validateAiGraphqlQuery('{ game { id } }');

    expect(result.ok).toBe(false);
    expect(result.reason).toContain('needs a literal limit');
  });

  it('rejects a limit above the cap', () => {
    const result = validateAiGraphqlQuery(`{ game(limit: ${MAX_ROOT_LIMIT + 1}) { id } }`);

    expect(result.ok).toBe(false);
    expect(result.reason).toContain(String(MAX_ROOT_LIMIT));
  });

  it('rejects variables so limits cannot be smuggled in', () => {
    const result = validateAiGraphqlQuery('query ($n: Int!) { game(limit: $n) { id } }');

    expect(result.ok).toBe(false);
    expect(result.reason).toContain('variables');
  });

  it('rejects nesting deeper than the cap', () => {
    const result = validateAiGraphqlQuery(
      '{ game(limit: 5) { lines { provider { parent { child { leaf } } } } } }'
    );

    expect(result.ok).toBe(false);
    expect(result.reason).toContain(String(MAX_DEPTH));
  });

  it('rejects more than one operation per call', () => {
    const result = validateAiGraphqlQuery(
      '{ game(limit: 1) { id } } { calendar(limit: 1) { week } }'
    );

    expect(result.ok).toBe(false);
    expect(result.reason).toContain('one operation');
  });

  it('rejects a query that does not parse', () => {
    const result = validateAiGraphqlQuery('{ game(limit: 1) { id }');

    expect(result.ok).toBe(false);
    expect(result.reason).toContain('does not parse');
  });

  it('rejects an oversized query before parsing it', () => {
    const result = validateAiGraphqlQuery('#'.repeat(MAX_QUERY_CHARS + 1));

    expect(result.ok).toBe(false);
    expect(result.reason).toContain(String(MAX_QUERY_CHARS));
  });

  it('rejects fragments rather than trying to resolve them', () => {
    const result = validateAiGraphqlQuery('{ ...GameFields }');

    expect(result.ok).toBe(false);
    expect(result.reason).toContain('Fragments');
  });

  it('allows two root fields at the cap', () => {
    const result = validateAiGraphqlQuery('{ game(limit: 5) { id } calendar(limit: 5) { week } }');

    expect(result.ok).toBe(true);
    expect(result.rootFields).toEqual(['game', 'calendar']);
  });
});
