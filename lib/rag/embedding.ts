const MODEL = 'voyage-3.5-lite';
const OUTPUT_DIMENSION = 512;
const BATCH_SIZE = 5;
const BATCH_DELAY_MS = 65_000;

type VoyageClient = {
  embed(req: {
    input: string[];
    model: string;
    inputType: 'query' | 'document';
    outputDimension: number;
  }): Promise<{ data?: Array<{ embedding?: number[] }> }>;
};

type VoyageModule = {
  VoyageAIClient: new (opts: { apiKey: string; maxRetries: number }) => VoyageClient;
};

let voyageModule: VoyageModule | null = null;

const loadVoyage = async (): Promise<VoyageModule> => {
  if (!voyageModule) {
    voyageModule = (await import('voyageai')) as unknown as VoyageModule;
  }
  return voyageModule;
};

const getClient = async (): Promise<VoyageClient> => {
  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey) throw new Error('VOYAGE_API_KEY is not configured');
  const { VoyageAIClient } = await loadVoyage();
  return new VoyageAIClient({ apiKey, maxRetries: 0 });
};

export const embedQuery = async (text: string): Promise<number[]> => {
  const client = await getClient();
  const response = await client.embed({
    input: [text],
    model: MODEL,
    inputType: 'query',
    outputDimension: OUTPUT_DIMENSION,
  });
  const embedding = response.data?.[0]?.embedding;
  if (!embedding) throw new Error('No embedding returned from Voyage AI');
  return embedding;
};

export const embedDocuments = async (texts: string[]): Promise<number[][]> => {
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const client = await getClient();
    const response = await client.embed({
      input: batch,
      model: MODEL,
      inputType: 'document',
      outputDimension: OUTPUT_DIMENSION,
    });

    const embeddings = response.data?.map((d) => d.embedding).filter(Boolean) as number[][];
    if (!embeddings || embeddings.length !== batch.length) {
      throw new Error(`Expected ${batch.length} embeddings, got ${embeddings?.length ?? 0}`);
    }
    results.push(...embeddings);

    if (i + BATCH_SIZE < texts.length) {
      await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
    }
  }

  return results;
};
