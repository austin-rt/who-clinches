import { parse, Kind, type DocumentNode, type SelectionSetNode, type ValueNode } from 'graphql';

export const MAX_QUERY_CHARS = 4000;
export const MAX_ROOT_FIELDS = 2;
export const MAX_SELECTIONS = 60;
export const MAX_DEPTH = 5;
export const MAX_ROOT_LIMIT = 100;
export const MAX_NESTED_LIMIT = 25;
export const MAX_COMPLEXITY = 1000;

export const GRAPHQL_ALLOWED_ROOTS = new Set([
  'game',
  'gameAggregate',
  'scoreboard',
  'gameLines',
  'currentTeams',
  'historicalTeam',
  'ratings',
  'poll',
  'pollRank',
  'calendar',
  'conference',
  'coach',
  'coachSeason',
  'recruit',
  'transfer',
  'draftPicks',
  'teamTalent',
  'gameWeather',
  'gameMedia',
  'linesProvider',
]);

export interface GraphqlValidationResult {
  ok: boolean;
  reason?: string;
  rootFields?: string[];
}

const fail = (reason: string): GraphqlValidationResult => ({ ok: false, reason });

const intValue = (value: ValueNode | undefined): number | null =>
  value && value.kind === Kind.INT ? parseInt(value.value, 10) : null;

const countSelections = (selectionSet: SelectionSetNode | undefined): number => {
  if (!selectionSet) return 0;
  return selectionSet.selections.reduce((total, selection) => {
    if (selection.kind !== Kind.FIELD) return total;
    return total + 1 + countSelections(selection.selectionSet);
  }, 0);
};

const maxDepth = (selectionSet: SelectionSetNode | undefined, depth = 1): number => {
  if (!selectionSet) return depth - 1;
  return selectionSet.selections.reduce((deepest, selection) => {
    if (selection.kind !== Kind.FIELD) return deepest;
    return Math.max(deepest, maxDepth(selection.selectionSet, depth + 1));
  }, depth);
};

export const validateAiGraphqlQuery = (
  query: string,
  allowedRoots: ReadonlySet<string> = GRAPHQL_ALLOWED_ROOTS
): GraphqlValidationResult => {
  if (query.length > MAX_QUERY_CHARS) {
    return fail(`Query is too long. Keep it under ${MAX_QUERY_CHARS} characters.`);
  }

  let document: DocumentNode;
  try {
    document = parse(query);
  } catch (error) {
    return fail(`Query does not parse: ${error instanceof Error ? error.message : 'syntax error'}`);
  }

  if (document.definitions.length !== 1) {
    return fail('Send exactly one operation per call.');
  }

  const [definition] = document.definitions;
  if (definition.kind !== Kind.OPERATION_DEFINITION) {
    return fail('Only query operations are allowed.');
  }
  if (definition.operation !== 'query') {
    return fail(`Only query operations are allowed. Received a ${definition.operation}.`);
  }
  if (definition.variableDefinitions && definition.variableDefinitions.length > 0) {
    return fail('Do not use variables. Inline literal argument values instead.');
  }

  if (query.includes('__schema') || query.includes('__type')) {
    return fail('Introspection is not available. Use the field reference in your context instead.');
  }

  const rootSelections = definition.selectionSet.selections;
  if (rootSelections.some((selection) => selection.kind !== Kind.FIELD)) {
    return fail('Fragments are not supported. Select fields directly.');
  }

  const rootFields = rootSelections.flatMap((selection) =>
    selection.kind === Kind.FIELD ? [selection.name.value] : []
  );

  if (rootFields.length > MAX_ROOT_FIELDS) {
    return fail(`Request at most ${MAX_ROOT_FIELDS} root fields per query.`);
  }

  const disallowed = rootFields.filter((name) => !allowedRoots.has(name));
  if (disallowed.length > 0) {
    return fail(
      `These root fields are not available: ${disallowed.join(', ')}. ` +
        `Choose from: ${Array.from(allowedRoots).sort().join(', ')}.`
    );
  }

  if (countSelections(definition.selectionSet) > MAX_SELECTIONS) {
    return fail(`Select fewer fields. The limit is ${MAX_SELECTIONS} across the query.`);
  }

  if (maxDepth(definition.selectionSet) > MAX_DEPTH) {
    return fail(`Nesting is too deep. The limit is ${MAX_DEPTH} levels.`);
  }

  let complexity = 1;
  for (const selection of rootSelections) {
    if (selection.kind !== Kind.FIELD) continue;
    const limitArg = selection.arguments?.find((arg) => arg.name.value === 'limit');
    const limit = intValue(limitArg?.value);

    if (limit === null) {
      return fail(
        `Root field '${selection.name.value}' needs a literal limit. ` +
          `Add limit: 25 (maximum ${MAX_ROOT_LIMIT}).`
      );
    }
    if (limit < 1 || limit > MAX_ROOT_LIMIT) {
      return fail(`limit on '${selection.name.value}' must be between 1 and ${MAX_ROOT_LIMIT}.`);
    }
    complexity += limit;
  }

  if (complexity > MAX_COMPLEXITY) {
    return fail(`Query is too expensive. Reduce the limits.`);
  }

  return { ok: true, rootFields };
};
