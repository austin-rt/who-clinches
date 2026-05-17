import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { db } from '@/lib/db/client';
import { createHash } from 'crypto';
import { getTeamMatcher } from '@/lib/cfb/helpers/team-index';
import {
  loadConferenceData,
  loadTeamScenarios,
  buildSystemPrompt,
  formatStandingsContext,
  formatGamesContext,
  formatScenarioContext,
  formatRagContext,
  resolveTeamConference,
} from '@/lib/cfb/chat/context-assembly';
import { resolveOverrides } from '@/lib/cfb/chat/resolve-overrides';
import { runConferenceSimulation } from '@/lib/cfb/runConferenceSimulation';
import { retrieveRelevantChunks } from '@/lib/rag/retrieval';
import { CFB_CONFERENCE_METADATA, type CFBConferenceAbbreviation } from '@/lib/cfb/constants';
import { getRuntimeConfig } from '@/lib/admin/runtime-config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SIMULATING_QUIPS = [
  'Running the numbers...',
  'Let me simulate that real quick.',
  'Hold on, crunching the scenarios.',
  'Give me a sec — running it through the engine.',
  'Let me plug that in and see what shakes out.',
];
let lastQuipIndex = -1;

const CHAT_RATE_LIMIT_MS = 8_000;
const chatRateMap = new Map<string, number>();

const checkChatRateLimit = (ip: string): number | null => {
  const now = Date.now();
  const lastRequest = chatRateMap.get(ip);
  if (lastRequest && now - lastRequest < CHAT_RATE_LIMIT_MS) {
    return Math.ceil((CHAT_RATE_LIMIT_MS - (now - lastRequest)) / 1000);
  }
  chatRateMap.set(ip, now);
  if (chatRateMap.size > 10_000) {
    const cutoff = now - CHAT_RATE_LIMIT_MS;
    for (const [key, ts] of chatRateMap) {
      if (ts < cutoff) chatRateMap.delete(key);
    }
  }
  return null;
};

interface ChatRequestBody {
  message: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  conferenceHint?: CFBConferenceAbbreviation;
  teamId?: string;
  sessionId?: string;
}

const FIXTURE_RESPONSE =
  'Based on the current standings, your team needs to win out and get some help from other conference games. ' +
  'The most likely path involves winning the remaining conference games while hoping for a key upset in the division. ' +
  "Let me break down the specific scenarios based on this week's matchups.";

const streamFixtureResponse = (): ReadableStream => {
  const words = FIXTURE_RESPONSE.split(' ');
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      for (const word of words) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'delta', text: word + ' ' })}\n\n`)
        );
        await new Promise((r) => setTimeout(r, 30 + Math.random() * 50));
      }
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
      controller.close();
    },
  });
};

export const POST = async (request: NextRequest) => {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'anonymous';
    const retrySeconds = process.env.VERCEL_ENV ? checkChatRateLimit(ip) : null;
    if (retrySeconds !== null) {
      return Response.json(
        { error: 'Rate limit exceeded. Try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': retrySeconds.toString() },
        }
      );
    }

    const body: ChatRequestBody = await request.json();
    const { message, history = [], conferenceHint, teamId: explicitTeamId, sessionId } = body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return Response.json({ error: 'Message is required' }, { status: 400 });
    }

    if (message.length > 500) {
      return Response.json({ error: 'Message too long' }, { status: 400 });
    }

    const matcher = await getTeamMatcher();
    const match = matcher.bestMatch(message);

    let conf: CFBConferenceAbbreviation | null = conferenceHint ?? null;
    let targetTeamId: string | null = explicitTeamId ?? null;
    let targetTeamName: string | null = null;
    let ambiguousMatches: Array<{ school: string; conference: string | null }> | null = null;

    if (match && match.score < 0.3) {
      if (matcher.isAmbiguous(message, 0.05)) {
        const topMatches = matcher.topMatches(message, 3);
        ambiguousMatches = topMatches.map((m) => ({
          school: m.team.school,
          conference: m.team.conference,
        }));
      } else {
        const teamConf = resolveTeamConference(match.team);
        if (!conferenceHint || teamConf === conferenceHint) {
          targetTeamId = String(match.team.id);
          targetTeamName = match.team.school;
          if (teamConf) conf = teamConf;
        }
      }
    }

    if (!conf) {
      return Response.json(
        { error: 'Could not determine conference. Please specify a team or conference.' },
        { status: 400 }
      );
    }

    const runtimeConfig = await getRuntimeConfig();
    if (!runtimeConfig.aiChatOn) {
      await new Promise((r) => setTimeout(r, 800 + Math.random() * 700));
      return new Response(streamFixtureResponse(), {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    const confMeta = CFB_CONFERENCE_METADATA[conf];

    const [data, ragChunks] = await Promise.all([
      loadConferenceData(conf),
      runtimeConfig.ragOn ? retrieveRelevantChunks(message, confMeta.cfbdId) : Promise.resolve([]),
    ]);

    const contextParts: string[] = [
      formatStandingsContext(data.standings, data.teams),
      formatGamesContext(data.games, data.teams),
    ];

    if (ragChunks.length > 0) {
      contextParts.push(formatRagContext(ragChunks));
    }

    if (ambiguousMatches) {
      contextParts.push(
        `The user may be referring to one of these teams: ${ambiguousMatches.map((m) => `${m.school} (${m.conference})`).join(', ')}. ` +
          'Ask them to clarify which team they mean.'
      );
    }

    if (targetTeamId && targetTeamName) {
      const scenarios = await loadTeamScenarios(conf, targetTeamId, data.games, data.teams);
      contextParts.push(formatScenarioContext(targetTeamName, scenarios, data.games, data.teams));
    }

    const systemPrompt = buildSystemPrompt(confMeta.name, ragChunks.length > 0);
    const contextBlock = contextParts.join('\n\n');
    const promptHash = createHash('sha256').update(systemPrompt).digest('hex').slice(0, 12);

    const logMeta = { sessionId, conf, teamId: targetTeamId, teamName: targetTeamName, promptHash };

    const logMessage = (
      role: string,
      content: string,
      tokens?: { inputTokens: number; outputTokens: number }
    ) => {
      if (!sessionId) return;
      db.chatMessage
        .create({
          data: {
            sessionId,
            role,
            content,
            conf: logMeta.conf,
            teamId: logMeta.teamId,
            teamName: logMeta.teamName,
            promptHash: logMeta.promptHash,
            ...(tokens ?? {}),
          },
        })
        .catch(() => {});
    };

    logMessage('user', message);

    const anthropicMessages: Anthropic.MessageParam[] = [
      ...history.slice(-10).map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      {
        role: 'user',
        content: `[Context]\n${contextBlock}\n\n[Question]\n${message}`,
      },
    ];

    const simulateTool: Anthropic.Tool = {
      name: 'simulate_scenario',
      description:
        "Run the conference simulation with hypothetical game outcomes. Use this when the user asks 'what if' questions. " +
        'Use a preset scenario when one fits (home_wins, away_wins, team_wins_out, team_loses_out, flip_results). ' +
        'Only use custom overrides for specific matchup questions like "what if Alabama beat Georgia."',
      input_schema: {
        type: 'object' as const,
        properties: {
          scenario: {
            type: 'string',
            enum: [
              'home_wins',
              'away_wins',
              'team_wins_out',
              'team_loses_out',
              'flip_results',
              'custom',
            ],
            description:
              'home_wins: every home team wins. away_wins: every away team wins. ' +
              'team_wins_out: a specific team wins all remaining games. ' +
              'team_loses_out: a specific team loses all remaining games. ' +
              'flip_results: reverse the outcome of every completed game. ' +
              'custom: use the overrides array for specific matchups.',
          },
          team: {
            type: 'string',
            description: 'Team name (required for team_wins_out and team_loses_out)',
          },
          overrides: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                home_team: { type: 'string', description: 'One team in the matchup' },
                away_team: { type: 'string', description: 'The other team in the matchup' },
                winner: { type: 'string', description: 'Which team wins' },
              },
              required: ['home_team', 'away_team', 'winner'],
            },
            description: 'Game outcomes to override (only for scenario: custom)',
          },
        },
        required: ['scenario'],
      },
    };

    const anthropic = new Anthropic();

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        let fullResponse = '';
        let inputTokens = 0;
        let outputTokens = 0;

        const streamResponse = async (msgs: Anthropic.MessageParam[]) => {
          const stream = anthropic.messages.stream({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 8192,
            system: systemPrompt,
            messages: msgs,
            tools: [simulateTool],
          });

          let toolUseBlock: { id: string; name: string; input: string } | null = null;

          for await (const event of stream) {
            if (event.type === 'message_start') {
              inputTokens += event.message.usage.input_tokens;
            } else if (event.type === 'message_delta') {
              outputTokens += event.usage.output_tokens;
            } else if (
              event.type === 'content_block_start' &&
              event.content_block.type === 'tool_use'
            ) {
              toolUseBlock = {
                id: event.content_block.id,
                name: event.content_block.name,
                input: '',
              };
            } else if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'input_json_delta'
            ) {
              if (toolUseBlock) toolUseBlock.input += event.delta.partial_json;
            } else if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              fullResponse += event.delta.text;
              const chunk = `data: ${JSON.stringify({ type: 'delta', text: event.delta.text })}\n\n`;
              controller.enqueue(encoder.encode(chunk));
            }
          }

          if (toolUseBlock && toolUseBlock.name === 'simulate_scenario') {
            if (!fullResponse.trim()) {
              const eligible = SIMULATING_QUIPS.filter((_, i) => i !== lastQuipIndex);
              const picked = Math.floor(Math.random() * eligible.length);
              lastQuipIndex = SIMULATING_QUIPS.indexOf(eligible[picked]);
              const quip = eligible[picked];
              fullResponse += quip;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'delta', text: quip })}\n\n`)
              );
            }
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'break' })}\n\n`));
            const minDots = new Promise((r) => setTimeout(r, 1500 + Math.random() * 1000));
            const toolInput = JSON.parse(toolUseBlock.input);
            const scenario: string = toolInput.scenario ?? 'custom';

            const overridesMap: Record<string, { homeScore: number; awayScore: number }> = {};
            let presetLabel = '';
            let unresolvable: Array<{ reason: string }> = [];
            let totalResolved = 0;

            const confGames = data.games.filter(
              (g) =>
                g.conferenceGame &&
                g.gameType?.abbreviation !== 'post' &&
                g.gameType?.abbreviation !== 'spring_post'
            );

            if (scenario === 'home_wins') {
              presetLabel = 'all home teams win';
              for (const g of confGames) {
                overridesMap[g._id] = { homeScore: 1, awayScore: 0 };
              }
              totalResolved = Object.keys(overridesMap).length;
            } else if (scenario === 'away_wins') {
              presetLabel = 'all away teams win';
              for (const g of confGames) {
                overridesMap[g._id] = { homeScore: 0, awayScore: 1 };
              }
              totalResolved = Object.keys(overridesMap).length;
            } else if (scenario === 'flip_results') {
              presetLabel = 'all results flipped';
              for (const g of confGames.filter((g) => g.completed)) {
                const homeWon = (g.home.score ?? 0) > (g.away.score ?? 0);
                overridesMap[g._id] = homeWon
                  ? { homeScore: 0, awayScore: 1 }
                  : { homeScore: 1, awayScore: 0 };
              }
              totalResolved = Object.keys(overridesMap).length;
            } else if (scenario === 'team_wins_out' || scenario === 'team_loses_out') {
              const teamMatcher = await getTeamMatcher();
              const teamMatch = teamMatcher.bestMatch(toolInput.team ?? '');
              if (!teamMatch || teamMatch.score > 0.4) {
                unresolvable = [{ reason: `Could not identify team "${toolInput.team}"` }];
              } else {
                const tid = String(teamMatch.team.id);
                presetLabel = `${teamMatch.team.school} ${scenario === 'team_wins_out' ? 'wins out' : 'loses out'}`;
                for (const g of confGames.filter((g) => !g.completed)) {
                  if (g.home.teamId === tid || g.away.teamId === tid) {
                    const teamIsHome = g.home.teamId === tid;
                    const teamWins = scenario === 'team_wins_out';
                    overridesMap[g._id] =
                      teamIsHome === teamWins
                        ? { homeScore: 1, awayScore: 0 }
                        : { homeScore: 0, awayScore: 1 };
                  }
                }
                totalResolved = Object.keys(overridesMap).length;
              }
            } else {
              const customResult = await resolveOverrides(toolInput.overrides ?? []);
              unresolvable = customResult.unresolvable.map((u) => ({ reason: u.reason }));
              for (const [, overrideList] of customResult.resolved) {
                totalResolved += overrideList.length;
                for (const o of overrideList) {
                  overridesMap[o.gameId] = { homeScore: o.homeScore, awayScore: o.awayScore };
                }
              }
            }

            const resultParts: string[] = [];

            if (totalResolved > 0) {
              const simResult = await runConferenceSimulation({
                games: data.games,
                teams: data.teams,
                overrides: overridesMap,
                conf,
              });

              const teamMap = new Map(data.teams.map((t) => [t._id, t]));
              const standingsLines = simResult.standings.map((s) => {
                const team = teamMap.get(s.teamId);
                return `${s.rank}. ${team?.shortDisplayName ?? s.displayName} (${s.confRecord.wins}-${s.confRecord.losses})`;
              });

              const champ1 = teamMap.get(simResult.championship[0])?.shortDisplayName ?? '?';
              const champ2 = teamMap.get(simResult.championship[1])?.shortDisplayName ?? '?';

              resultParts.push(
                `CHAMPIONSHIP GAME: ${champ1} vs ${champ2}\n\n` +
                  `Full ${conf.toUpperCase()} standings${presetLabel ? ` (${presetLabel}, ${totalResolved} games)` : ` (${totalResolved} games overridden)`}:\n${standingsLines.join('\n')}`
              );
            }

            if (unresolvable.length > 0) {
              resultParts.push(
                `WARNING: ${unresolvable.length} overrides could not be applied (${totalResolved} succeeded):\n` +
                  unresolvable.map((u) => `- ${u.reason}`).join('\n')
              );
            }

            const toolResult = resultParts.join('\n\n');

            logMessage(
              'tool',
              JSON.stringify({
                scenario,
                team: toolInput.team ?? null,
                resolved: totalResolved,
                unresolvable: unresolvable.map((u) => u.reason),
                result: toolResult,
              })
            );

            const followupMsgs: Anthropic.MessageParam[] = [
              ...msgs,
              {
                role: 'assistant',
                content: [
                  {
                    type: 'tool_use',
                    id: toolUseBlock.id,
                    name: toolUseBlock.name,
                    input: toolInput,
                  },
                ],
              },
              {
                role: 'user',
                content: [
                  { type: 'tool_result', tool_use_id: toolUseBlock.id, content: toolResult },
                ],
              },
            ];

            await minDots;
            await streamResponse(followupMsgs);
          }
        };

        try {
          await streamResponse(anthropicMessages);
          logMessage('assistant', fullResponse, { inputTokens, outputTokens });
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
          controller.close();
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Stream error';
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'error', error: errorMsg })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    const { logError } = await import('@/lib/errorLogger');
    await logError(error, { endpoint: '/api/chat', action: 'chat' });
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
};
