// AI service. Provider-agnostic; environment variable decides.
// Has a deterministic regex/heuristic fallback so the app works without an API key.
import { config, aiConfigured } from '../config/index.js';

const DAY_WORDS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun', 'today', 'tomorrow', 'weekend', 'evening', 'morning', 'night', 'afternoon'];
const SKILL_HINTS = [
  'react', 'next', 'vue', 'angular', 'svelte', 'node', 'express', 'django', 'flask', 'fastapi',
  'python', 'java', 'c++', 'c#', 'go', 'rust', 'kotlin', 'swift', 'typescript', 'javascript',
  'mongodb', 'mysql', 'postgres', 'redis', 'sql', 'nosql',
  'figma', 'photoshop', 'illustrator', 'canva',
  'machine learning', 'ml', 'deep learning', 'nlp', 'data science', 'pandas', 'numpy', 'pytorch', 'tensorflow',
  'dsa', 'algorithms', 'data structures', 'system design',
  'css', 'html', 'tailwind', 'bootstrap',
  'android', 'ios', 'flutter', 'react native',
  'git', 'github', 'docker', 'kubernetes', 'aws', 'azure', 'gcp',
  'blockchain', 'web3', 'solidity',
  'communication', 'public speaking', 'writing', 'essay', 'resume', 'interview', 'aptitude'
];

const INTENT_SYS = 'You extract structured search intent from a student help request. Respond ONLY with valid JSON: { "skills": [string], "intent": "learn"|"teach", "availability": { "day": string, "time": string }, "problem": string }';
const SUMMARY_SYS = 'Summarize a tutoring session. Respond ONLY with JSON: {"topics":[string],"summary":string,"recommendations":[string]}';
const DEFAULT_GEMINI_MODEL = 'gemini-3.5-flash';

function fallback(prompt) {
  const p = (prompt || '').toLowerCase();
  const skills = [];
  for (const s of SKILL_HINTS) if (p.includes(s)) skills.push(s);
  const wantsTeach = /i (can|will|offer|teach|give)/.test(p);
  const wantsLearn = /i (need|want|looking|learn|study|find|require|require help)/.test(p);
  const day = DAY_WORDS.find((d) => p.includes(d)) || '';
  const timeMatch = p.match(/\b([01]?\d|2[0-3])(?::[0-5]\d)?\s*(am|pm)?\b/);
  const time = timeMatch ? timeMatch[0] : '';
  return {
    skills: Array.from(new Set(skills)),
    intent: wantsTeach && !wantsLearn ? 'teach' : 'learn',
    availability: { day, time },
    problem: prompt,
    confidence: skills.length > 0 ? 0.6 : 0.3
  };
}

// Build a human explanation of why a peer matches the parsed intent.
// ponytail: string-templated; if you want richer prose, swap for an LLM call later.
function explainMatch(match, intent) {
  const r = match?.match?.reasons || {};
  const user = match?.user || {};
  const first = (user.name || 'They').split(' ')[0];
  const teaching = (user.skillsCanTeach || []).slice(0, 3).map((s) => s.name);
  const learning = (user.skillsToLearn || []).slice(0, 2).map((s) => s.name);
  const asked = intent?.skills || [];
  const askedStr = asked.length ? asked.join(', ') : 'your request';

  const sentences = [];

  if (r.reciprocal && r.aWantsMine?.length && r.bWantsMine?.length) {
    sentences.push(
      `${first} is a two-way swap: they teach ${r.bWantsMine.slice(0, 2).join(' and ')}, ` +
      `which is exactly what you want to learn, and they want to learn ${r.aWantsMine.slice(0, 2).join(' and ')} ` +
      `from you. Both sides win, so a Time Credit exchange settles cleanly.`
    );
  } else if (r.bWantsMine?.length) {
    sentences.push(
      `${first} teaches ${r.bWantsMine.slice(0, 2).join(' and ')}, ` +
      `which lines up with your interest in ${askedStr}.`
    );
  } else if (r.aWantsMine?.length) {
    sentences.push(
      `${first} wants to learn ${r.aWantsMine.slice(0, 2).join(' and ')} — ` +
      `a topic you already know — so this could work as a one-way session where you teach.`
    );
  } else {
    sentences.push(`${first}'s profile overlaps with what you're looking for (${askedStr}).`);
  }

  const proof = [];
  if (r.availabilityOverlap) proof.push(`your weekly availability already overlaps with theirs`);
  if ((user.trustScore || 0) >= 70) proof.push(`they have a strong trust score of ${user.trustScore}/100`);
  else if ((user.trustScore || 0) >= 50) proof.push(`their trust score is ${user.trustScore}/100`);
  if ((user.ratingsCount || 0) >= 3) proof.push(`they've been rated ${user.ratingAvg?.toFixed?.(1) || user.ratingAvg}/5 by ${user.ratingsCount} peers`);
  if (user.department && user.year) proof.push(`they're in ${user.department}, ${user.year}`);
  if (proof.length) {
    sentences.push(`Worth knowing: ${proof.slice(0, 3).join(', ')}.`);
  }

  if (learning.length) {
    sentences.push(`Reach out by mentioning one of the things they'd like to learn (${learning.join(', ')}) — that turns a cold message into a swap.`);
  }

  return sentences.join(' ');
}

function geminiUrl(model) {
  const m = model || DEFAULT_GEMINI_MODEL;
  return `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`;
}

async function callGemini(promptText, { system, model }) {
  const url = geminiUrl(model);
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'X-goog-api-key': config.ai.apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `${system}\n\nUser: ${promptText}` }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.2 }
    })
  });
  if (!r.ok) {
    const err = await r.text().catch(() => '');
    throw new Error(`Gemini ${r.status}: ${err.slice(0, 200)}`);
  }
  const data = await r.json();
  const txt = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  return JSON.parse(txt);
}

async function callOpenAI(prompt, { system, model, jsonMode = true }) {
  const body = {
    model: model || 'gpt-4o-mini',
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: prompt }
    ]
  };
  if (jsonMode) body.response_format = { type: 'json_object' };
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.ai.apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error(`OpenAI ${r.status}`);
  const data = await r.json();
  return JSON.parse(data.choices?.[0]?.message?.content || '{}');
}

async function callAnthropic(prompt, { system, model }) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': config.ai.apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: model || 'claude-3-5-haiku-latest',
      max_tokens: 400,
      system,
      messages: [{ role: 'user', content: prompt }]
    })
  });
  if (!r.ok) throw new Error(`Anthropic ${r.status}`);
  const data = await r.json();
  return JSON.parse(data.content?.[0]?.text || '{}');
}

async function callProvider(prompt) {
  const { provider, model } = config.ai;
  if (provider === 'gemini') return callGemini(prompt, { system: INTENT_SYS, model });
  if (provider === 'openai' || provider === 'openai_compat') return callOpenAI(prompt, { system: INTENT_SYS, model });
  if (provider === 'anthropic') return callAnthropic(prompt, { system: INTENT_SYS, model });
  throw new Error(`Unknown AI provider: ${provider}`);
}

export { explainMatch };

const SMALL_TALK = /^(hi|hey|hello|yo|sup|hii+|heya|hola|thanks|thank you|thx|ok|okay|cool|nice|great|bye|goodbye)\W*$/i;
const MIN_PROMPT_LEN = 8;

export async function extractIntent(prompt, matches = []) {
  const cleaned = (prompt || '').trim();
  // Guard: short / small-talk prompts get a conversational reply, not an empty match list.
  if (cleaned.length < MIN_PROMPT_LEN || SMALL_TALK.test(cleaned)) {
    return {
      intent: { skills: [], intent: 'learn', availability: { day: '', time: '' }, problem: cleaned, confidence: 0, provider: 'fallback' },
      matches: [],
      aiEnabled: aiConfigured,
      reply: shortTalkReply(cleaned)
    };
  }
  const intent = aiConfigured
    ? await safeCall(cleaned)
    : { ...fallback(cleaned), provider: 'fallback' };

  // If the intent extractor found nothing the matcher can use, surface a helpful nudge.
  if (!intent.skills?.length) {
    return {
      intent,
      matches: [],
      aiEnabled: aiConfigured,
      reply: vagueReply(cleaned)
    };
  }

  const enriched = (matches || []).map((m) => ({ ...m, explanation: explainMatch(m, intent) }));
  return { intent, matches: enriched, aiEnabled: aiConfigured };
}

function shortTalkReply(prompt) {
  const lower = prompt.toLowerCase();
  if (/^(thanks|thank you|thx)/.test(lower)) return "You're welcome — happy swapping.";
  if (/^(bye|goodbye)/.test(lower)) return 'See you on campus. Good luck with the swaps.';
  return "Hey! Tell me what you want to learn — for example, \"I need a React mentor\" or \"help me find a Figma teacher for the weekend\".";
}

function vagueReply(prompt) {
  return `I couldn't pick a clear skill from "${prompt}". Try something like:\n` +
    `• "Teach me React, free Saturday evening"\n` +
    `• "I want to learn Figma and can teach Python"\n` +
    `• "Find a DSA mentor before my placements"`;
}

async function safeCall(prompt) {
  try {
    const out = await callProvider(prompt);
    return { ...out, provider: config.ai.provider };
  } catch (e) {
    return { ...fallback(prompt), provider: 'fallback', error: String(e.message || e) };
  }
}

export async function summarizeSession({ messages, problem }) {
  if (!aiConfigured) {
    return {
      summary: `Topics covered: ${problem || 'session'}. (AI summary unavailable in fallback mode.)`,
      topics: [],
      recommendations: []
    };
  }
  try {
    const chat = messages.slice(-30).map((m) => `${m.senderName || 'user'}: ${m.text}`).join('\n');
    const promptText = `Problem: ${problem || ''}\n\nChat:\n${chat}`;
    if (config.ai.provider === 'gemini') return await callGemini(promptText, { system: SUMMARY_SYS, model: config.ai.model });
    if (config.ai.provider === 'openai' || config.ai.provider === 'openai_compat') return await callOpenAI(promptText, { system: SUMMARY_SYS, model: config.ai.model });
    if (config.ai.provider === 'anthropic') return await callAnthropic(promptText, { system: SUMMARY_SYS, model: config.ai.model });
    return { summary: 'AI summary unavailable.', topics: [], recommendations: [] };
  } catch (e) {
    return { summary: 'AI summary unavailable.', topics: [], recommendations: [], error: String(e.message || e) };
  }
}

export const DEFAULT_MODEL = { gemini: DEFAULT_GEMINI_MODEL };
