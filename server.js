import http from 'http';
import { fileURLToPath } from 'url';
import { dirname, join, extname } from 'path';
import { mkdir, readFile, stat, writeFile } from 'fs/promises';
import 'dotenv/config';
import * as cyberGuardian from './cyber_guardian/runtime.mjs';
import * as insightsEngine from './core/insights/insightsEngine.js';
import * as commandMapEngine from './core/command-map/commandMapEngine.js';
import * as holographicWorkshop from './core/workshop/holographicWorkshopEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PUBLIC_DIR = join(__dirname, 'public');
const PORT = process.env.PORT || 3000;
const FORGE_API_URL = process.env.FORGE_API_URL || 'http://localhost:4000';
const FORGE_WEB_URL = process.env.FORGE_WEB_URL || 'http://localhost:3002';
const SENTINEL_API_URL = process.env.SENTINEL_API_URL || 'http://localhost:8000';
const SENTINEL_WEB_URL = process.env.SENTINEL_WEB_URL || 'http://localhost:3001';

// Available AI models via OpenRouter
// Free model list updated July 2026 from openrouter.ai/api/v1/models
const AVAILABLE_MODELS = {
  // ── Free models (require :free suffix, zero cost per token) ──
  'nemotron-3-ultra':  'nvidia/nemotron-3-ultra-550b-a55b:free',
  'nemotron-3.5-lightning': 'nvidia/nemotron-3.5-lightning:free',
  'nemotron-3-super':  'nvidia/nemotron-3-super-120b-a12b:free',
  'nemotron-3-nano':   'nvidia/nemotron-3-nano-30b-a3b:free',
  'nemotron-nano-omni':'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
  'nemotron-nano-12b': 'nvidia/nemotron-nano-12b-v2-vl:free',
  'nemotron-nano-9b':  'nvidia/nemotron-nano-9b-v2:free',
  'lyria-3-pro':       'google/lyria-3-pro-preview',
  'lyria-3-clip':      'google/lyria-3-clip-preview',
  'gemma-4-31b':       'google/gemma-4-31b-it:free',
  'gemma-4-26b':       'google/gemma-4-26b-a4b-it:free',
  'laguna-m1':         'poolside/laguna-m.1:free',
  'laguna-s21':        'poolside/laguna-s-2.1:free',
  'laguna-xs21':       'poolside/laguna-xs-2.1:free',
  'ling-3-flash':      'inclusionai/ling-3.0-flash:free',
  'north-mini-code':   'cohere/north-mini-code:free',
  'gpt-oss-20b':       'openai/gpt-oss-20b:free',
  'llama-3.2-2b':      'meta-llama/llama-3.2-2b-instruct:free',
  'openrouter-free':   'openrouter/free',

  // ── Paid models (require credits) ──
  'gpt-4o':            'openai/gpt-4o',
  'gpt-4o-mini':       'openai/gpt-4o-mini',
  'claude-3.5-sonnet': 'anthropic/claude-3.5-sonnet',
  'claude-3-haiku':    'anthropic/claude-3-haiku',
  'gemini-1.5-pro':    'google/gemini-1.5-pro',
  'gemini-1.5-flash':  'google/gemini-1.5-flash',
};

const DEFAULT_MODEL = process.env.OPENROUTER_MODEL || 'nemotron-3-ultra';

// In-memory stores for MVP
const missions = new Map();
const tasks = new Map();
const findings = new Map();
const approvals = new Map();
let missionCounter = 3;
let taskCounter = 0;
let findingCounter = 0;
let approvalCounter = 0;

// Seed initial operational missions
const defaultMissions = [
  {
    id: 'mission-01',
    name: 'Build AURA OS V2',
    description: 'Transform the UI into a polished futuristic AI operating system with no human avatars.',
    status: 'RUNNING',
    progress: 90,
    agent: 'AURA Architect',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'mission-02',
    name: 'Integrate Scientific Knowledge Datasets',
    description: 'Link 118 periodic elements, 100 nanomaterials, and 100 advanced robotic entities.',
    status: 'COMPLETED',
    progress: 100,
    agent: 'Knowledge Graph Engine',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'mission-03',
    name: 'Optimize Model Routing & Latency',
    description: 'Benchmarking OpenRouter free tier models against local transformers.js pipeline.',
    status: 'QUEUED',
    progress: 20,
    agent: 'Model Optimizer',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    updatedAt: new Date().toISOString()
  }
];
for (const m of defaultMissions) {
  missions.set(m.id, m);
}

// Self-learning store
const learningStore = new Map();
const DATA_DIR = process.env.AURA_DATA_DIR || __dirname;
const LEARNING_FILE = join(DATA_DIR, 'learning-data.json');

await mkdir(DATA_DIR, { recursive: true });

async function loadLearningData() {
  try {
    const data = await readFile(LEARNING_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    for (const [key, value] of Object.entries(parsed)) {
      learningStore.set(key, value);
    }
    console.log(`Loaded ${learningStore.size} learning entries`);
  } catch (e) {
    console.log('No existing learning data, starting fresh');
  }
}

async function saveLearningData() {
  try {
    const obj = Object.fromEntries(learningStore);
    await writeFile(LEARNING_FILE, JSON.stringify(obj, null, 2));
  } catch (e) {
    console.error('Failed to save learning data:', e);
  }
}

function generateLearningId() { return `learn-${Date.now()}-${Math.random().toString(36).slice(2)}`; }

function addLearningEntry(input, expectedOutput, actualOutput, rating, tags = []) {
  const id = generateLearningId();
  const entry = {
    id,
    input,
    expectedOutput,
    actualOutput,
    rating,
    tags,
    timestamp: Date.now(),
    useCount: 0
  };
  learningStore.set(id, entry);
  saveLearningData();
  return entry;
}

function getRelevantLearning(input, maxEntries = 5) {
  const entries = Array.from(learningStore.values())
    .filter(e => e.rating >= 4)
    .sort((a, b) => b.useCount - a.useCount || b.timestamp - a.timestamp)
    .slice(0, maxEntries);
  return entries;
}

function buildLearningPrompt(input) {
  const relevant = getRelevantLearning(input);
  if (relevant.length === 0) return '';
  
  let prompt = '\n\n--- Learned Patterns (from user feedback) ---\n';
  for (const entry of relevant) {
    prompt += `User: ${entry.input}\n`;
    if (entry.expectedOutput) {
      prompt += `Preferred: ${entry.expectedOutput}\n`;
    }
    prompt += `---\n`;
    entry.useCount++;
  }
  saveLearningData();
  return prompt;
}

async function handleProxy(serviceName, targetUrl, req, res) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    
    const response = await fetch(targetUrl, {
      method: req.method,
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    });
    
    clearTimeout(timeout);
    
    res.writeHead(response.status, { 'Content-Type': 'application/json' });
    const data = await response.text();
    res.end(data);
  } catch (error) {
    res.writeHead(503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'unhealthy', 
      service: serviceName,
      error: error.name === 'AbortError' ? 'timeout' : error.message 
    }));
  }
}

async function handlePathProxy(serviceName, baseUrl, req, res) {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const targetUrl = `${baseUrl}${url.pathname}${url.search}`;
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    
    let body = '';
    req.on('data', chunk => body += chunk);
    await new Promise((resolve) => req.on('end', resolve));
    
    const headers = { ...req.headers };
    delete headers.host;
    delete headers['content-length'];
    
    const response = await fetch(targetUrl, {
      method: req.method,
      signal: controller.signal,
      headers: {
        ...headers,
        'Content-Type': headers['content-type'] || 'application/json',
      },
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : body || undefined
    });
    
    clearTimeout(timeout);
    
    const responseHeaders = {};
    response.headers.forEach((value, key) => {
      if (!['transfer-encoding', 'connection'].includes(key.toLowerCase())) {
        responseHeaders[key] = value;
      }
    });
    
    res.writeHead(response.status, responseHeaders);
    const data = await response.text();
    res.end(data);
  } catch (error) {
    res.writeHead(503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'unhealthy', 
      service: serviceName,
      error: error.name === 'AbortError' ? 'timeout' : error.message 
    }));
  }
}

function generateMissionId() { return `mission-${++missionCounter}-${Date.now()}`; }
function generateTaskId() { return `task-${++taskCounter}-${Date.now()}`; }
function generateFindingId() { return `finding-${++findingCounter}-${Date.now()}`; }
function generateApprovalId() { return `approval-${++approvalCounter}-${Date.now()}`; }

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

async function serveStatic(req, res, filePath) {
  try {
    const stats = await stat(filePath);
    if (!stats.isFile()) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }

    const ext = extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    const file = await readFile(filePath);
    res.end(file);
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.writeHead(404);
      res.end('Not found');
    } else {
      res.writeHead(500);
      res.end('Server error');
    }
  }
}

function getModelId(modelKey) {
  return AVAILABLE_MODELS[modelKey] || AVAILABLE_MODELS[DEFAULT_MODEL];
}

async function handleAssistant(req, res) {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', async () => {
    try {
      const { messages, model: modelKey, temperature = 0.7, max_tokens = 2048, stream = true, tools, userInput } = JSON.parse(body || '{}');
      
      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) {
        res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' });
        res.end('data: {"text": "Local demo mode. Configure OPENROUTER_API_KEY in .env for live AI.", "done": true}\n\n');
        return;
      }

      const modelId = getModelId(modelKey || DEFAULT_MODEL);
      
      let enhancedMessages = messages || [];
      if (userInput) {
        const learningPrompt = buildLearningPrompt(userInput);
        if (learningPrompt) {
          const hasSystem = enhancedMessages.some(m => m.role === 'system');
          if (hasSystem) {
            enhancedMessages = enhancedMessages.map(m => 
              m.role === 'system' ? { ...m, content: m.content + learningPrompt } : m
            );
          } else {
            enhancedMessages = [{ role: 'system', content: 'You are AURA, a helpful AI assistant.' + learningPrompt }, ...enhancedMessages];
          }
        }
      }
      
      const payload = {
        model: modelId,
        messages: enhancedMessages,
        temperature,
        max_tokens,
        stream,
      };

      if (tools) payload.tools = tools;

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'AURA Neural Assistant',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error?.message || `HTTP ${response.status}`);
      }

      if (!stream) {
        const data = await response.json();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
        return;
      }

      // Stream response
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              res.write('data: {"done": true}\n\n');
              continue;
            }
            try {
              const parsed = JSON.parse(data);
              const text = parsed.choices?.[0]?.delta?.content || '';
              const toolCalls = parsed.choices?.[0]?.delta?.tool_calls;
              const finishReason = parsed.choices?.[0]?.finish_reason;
              
              if (text) {
                res.write(`data: ${JSON.stringify({ text })}\n\n`);
              }
              if (toolCalls) {
                res.write(`data: ${JSON.stringify({ tool_calls: toolCalls })}\n\n`);
              }
              if (finishReason) {
                res.write(`data: ${JSON.stringify({ finish_reason: finishReason })}\n\n`);
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }

      res.end();
    } catch (error) {
      console.error('Assistant error:', error);
      res.writeHead(500, { 'Content-Type': 'text/event-stream' });
      res.end(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    }
  });
}

async function handleAPI(req, res) {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (path === '/api/status') {
    const hasKey = !!process.env.OPENROUTER_API_KEY;
    res.writeHead(200);
    res.end(JSON.stringify({
      liveAI: hasKey,
      liveNews: !!process.env.NEWS_API_KEY,
      liveWeather: true,
      model: DEFAULT_MODEL,
      availableModels: Object.keys(AVAILABLE_MODELS),
    }));
    return;
  }

  if (path === '/api/models') {
    res.writeHead(200);
    res.end(JSON.stringify(AVAILABLE_MODELS));
    return;
  }

  if (path === '/api/weather') {
    const city = url.searchParams.get('q') || 'Alappuzha';
    try {
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
      const geoRes = await fetch(geoUrl);
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        if (geoData.results && geoData.results.length > 0) {
          const place = geoData.results[0];
          const lat = place.latitude;
          const lon = place.longitude;
          const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m`;
          const weatherRes = await fetch(weatherUrl);
          if (weatherRes.ok) {
            const weatherData = await weatherRes.json();
            const cur = weatherData.current || {};
            const code = cur.weather_code || 0;
            let condition = 'Clear Sky';
            if (code === 1 || code === 2) condition = 'Partly Cloudy';
            else if (code === 3) condition = 'Overcast';
            else if (code >= 45 && code <= 48) condition = 'Foggy';
            else if (code >= 51 && code <= 67) condition = 'Rainy';
            else if (code >= 71 && code <= 77) condition = 'Snowy';
            else if (code >= 80 && code <= 82) condition = 'Rain Showers';
            else if (code >= 95) condition = 'Thunderstorm';

            res.writeHead(200);
            res.end(JSON.stringify({
              city: place.name || city,
              country: place.country_code || 'IN',
              temperature: Math.round(cur.temperature_2m ?? 28),
              feelsLike: Math.round(cur.apparent_temperature ?? 31),
              condition,
              humidity: Math.round(cur.relative_humidity_2m ?? 78),
              windSpeed: Math.round(cur.wind_speed_10m ?? 12),
              live: true
            }));
            return;
          }
        }
      }
    } catch (e) {
      // Fall through to fallback
    }

    res.writeHead(200);
    res.end(JSON.stringify({
      city,
      country: 'IN',
      temperature: 28,
      feelsLike: 31,
      condition: 'Partly Cloudy',
      humidity: 78,
      windSpeed: 12,
      live: false
    }));
    return;
  }

  if (path === '/api/news') {
    const apiKey = process.env.NEWS_API_KEY;
    const query = process.env.NEWS_API_QUERY || 'world';
    const language = process.env.NEWS_API_LANGUAGE || 'en';

    if (!apiKey) {
      res.writeHead(200);
      res.end(JSON.stringify({
        query,
        articles: [{
          title: 'Local mode: Configure NEWS_API_KEY in .env for live headlines',
          source: 'AURA System',
          publishedAt: new Date().toISOString(),
          description: 'Add your NewsAPI key to enable real-time news briefings.',
        }],
      }));
      return;
    }

    try {
      const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=${language}&pageSize=5&sortBy=publishedAt&apiKey=${apiKey}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'ok') {
        res.writeHead(200);
        res.end(JSON.stringify({
          query,
          articles: data.articles.map(a => ({
            title: a.title,
            source: a.source?.name || 'Unknown',
            publishedAt: a.publishedAt,
            description: a.description,
            url: a.url,
            urlToImage: a.urlToImage,
          })),
        }));
      } else {
        throw new Error(data.message || 'NewsAPI error');
      }
    } catch (error) {
      console.error('News API error:', error);
      res.writeHead(200);
      res.end(JSON.stringify({
        query,
        articles: [{
          title: 'Failed to fetch news',
          source: 'AURA System',
          publishedAt: new Date().toISOString(),
          description: error.message,
        }],
      }));
    }
    return;
  }

  if (path === '/api/assistant' && req.method === 'POST') {
    handleAssistant(req, res);
    return;
  }

  // Mission API endpoints
  if (path === '/api/missions' && req.method === 'POST') {
    handleCreateMission(req, res);
    return;
  }

  if (path === '/api/missions' && req.method === 'GET') {
    handleListMissions(req, res);
    return;
  }

  if (path.startsWith('/api/missions/') && req.method === 'GET') {
    const missionId = path.split('/')[3];
    if (missionId && !missionId.includes('/')) {
      handleGetMission(req, res, missionId);
      return;
    }
  }

  if (path.match(/^\/api\/missions\/[^/]+\/pause$/) && req.method === 'POST') {
    const missionId = path.split('/')[3];
    handlePauseMission(req, res, missionId);
    return;
  }

  if (path.match(/^\/api\/missions\/[^/]+\/resume$/) && req.method === 'POST') {
    const missionId = path.split('/')[3];
    handleResumeMission(req, res, missionId);
    return;
  }

  if (path.match(/^\/api\/missions\/[^/]+\/cancel$/) && req.method === 'POST') {
    const missionId = path.split('/')[3];
    handleCancelMission(req, res, missionId);
    return;
  }

  if (path.match(/^\/api\/missions\/[^/]+\/tasks$/) && req.method === 'GET') {
    const missionId = path.split('/')[3];
    handleGetMissionTasks(req, res, missionId);
    return;
  }

  if (path.match(/^\/api\/missions\/[^/]+\/findings$/) && req.method === 'GET') {
    const missionId = path.split('/')[3];
    handleGetMissionFindings(req, res, missionId);
    return;
  }

  if (path === '/api/approvals' && req.method === 'GET') {
    handleListApprovals(req, res);
    return;
  }

  if (path.match(/^\/api\/approvals\/[^/]+\/approve$/) && req.method === 'POST') {
    const approvalId = path.split('/')[3];
    handleApproveApproval(req, res, approvalId);
    return;
  }

  if (path.match(/^\/api\/approvals\/[^/]+\/reject$/) && req.method === 'POST') {
    const approvalId = path.split('/')[3];
    handleRejectApproval(req, res, approvalId);
    return;
  }

  if (path === '/api/findings' && req.method === 'GET') {
    handleListFindings(req, res);
    return;
  }

  if (path.match(/^\/api\/findings\/[^/]+\/remediate$/) && req.method === 'POST') {
    const findingId = path.split('/')[3];
    handleRemediateFinding(req, res, findingId);
    return;
  }

  // Learning API endpoints
  if (path === '/api/learning/feedback' && req.method === 'POST') {
    handleLearningFeedback(req, res);
    return;
  }

  if (path === '/api/learning/entries' && req.method === 'GET') {
    handleGetLearningEntries(req, res);
    return;
  }

  if (path.match(/^\/api\/learning\/entries\/[^/]+$/) && req.method === 'DELETE') {
    handleDeleteLearningEntry(req, res);
    return;
  }

  // Skills API endpoints
  if (path === '/api/skills' && req.method === 'GET') {
    await handleGetSkills(req, res);
    return;
  }

  if (path === '/api/skills/reload' && req.method === 'POST') {
    await handleReloadSkills(req, res);
    return;
  }

  if (path.match(/^\/api\/skills\/[^/]+$/) && req.method === 'GET') {
    await handleGetSkill(req, res);
    return;
  }

  if (path === '/api/skills/install' && req.method === 'POST') {
    handleInstallSkill(req, res);
    return;
  }

  if (path.match(/^\/api\/skills\/[^/]+\/enable$/) && req.method === 'POST') {
    handleEnableSkill(req, res);
    return;
  }

  if (path.match(/^\/api\/skills\/[^/]+\/disable$/) && req.method === 'POST') {
    handleDisableSkill(req, res);
    return;
  }

  if (path.match(/^\/api\/skills\/[^/]+\/config$/) && req.method === 'PATCH') {
    handleUpdateSkillConfig(req, res);
    return;
  }

  if (path.match(/^\/api\/skills\/[^/]+$/) && req.method === 'DELETE') {
    handleRemoveSkill(req, res);
    return;
  }

  // AI Insights API endpoints
  if (path === '/api/insights' && req.method === 'GET') {
    handleGetInsights(req, res);
    return;
  }

  if (path === '/api/insights/proactive' && req.method === 'GET') {
    const proactiveData = insightsEngine.generateProactiveDialogueResponse();
    jsonResponse(res, 200, proactiveData);
    return;
  }

  if (path === '/api/insights/reanalyze' && req.method === 'POST') {
    handleGetInsights(req, res);
    return;
  }

  if (path.match(/^\/api\/insights\/[^/]+\/action$/) && req.method === 'POST') {
    const insightId = path.split('/')[3];
    handleExecuteInsightAction(req, res, insightId);
    return;
  }

  if (path.match(/^\/api\/insights\/[^/]+\/dismiss$/) && req.method === 'POST') {
    const insightId = path.split('/')[3];
    handleDismissInsight(req, res, insightId);
    return;
  }

  if (path === '/api/insights/reset' && req.method === 'POST') {
    handleResetInsights(req, res);
    return;
  }

  // AURA Command Map API endpoints
  if (path === '/api/command-map' && req.method === 'GET') {
    jsonResponse(res, 200, commandMapEngine.getCommandMapState());
    return;
  }

  if (path === '/api/command-map/action/execute' && req.method === 'POST') {
    readBody(req).then(async (body) => {
      try {
        const result = await commandMapEngine.executeNextAction(body.actionId, body.options);
        jsonResponse(res, 200, result);
      } catch (err) {
        jsonResponse(res, 400, { error: err.message });
      }
    });
    return;
  }

  if (path === '/api/command-map/action/dismiss' && req.method === 'POST') {
    readBody(req).then((body) => {
      const result = commandMapEngine.dismissNextAction(body.actionId);
      jsonResponse(res, 200, result);
    });
    return;
  }

  if (path === '/api/command-map/action/explain' && req.method === 'POST') {
    const result = commandMapEngine.explainNextAction();
    jsonResponse(res, 200, result);
    return;
  }

  if (path === '/api/command-map/directive' && req.method === 'POST') {
    readBody(req).then((body) => {
      const result = commandMapEngine.handleDirective(body.text || '');
      jsonResponse(res, 200, result);
    });
    return;
  }

  // Holographic Workshop API endpoints
  if (path === '/api/workshop/state' && req.method === 'GET') {
    jsonResponse(res, 200, holographicWorkshop.getWorkshopState());
    return;
  }

  if (path === '/api/workshop/telemetry' && req.method === 'GET') {
    jsonResponse(res, 200, holographicWorkshop.getLiveTelemetry());
    return;
  }

  if (path === '/api/workshop/presets' && req.method === 'GET') {
    jsonResponse(res, 200, holographicWorkshop.getPresets());
    return;
  }

  if (path === '/api/workshop/presets' && req.method === 'POST') {
    readBody(req).then((body) => {
      try {
        const result = holographicWorkshop.savePreset(body);
        jsonResponse(res, 201, result);
      } catch (err) {
        jsonResponse(res, 400, { error: err.message });
      }
    });
    return;
  }

  if (path === '/api/workshop/dispatch' && req.method === 'POST') {
    readBody(req).then((body) => {
      try {
        const result = holographicWorkshop.dispatchNodeAction(body.nodeId, body.action, body.params);
        jsonResponse(res, 200, result);
      } catch (err) {
        jsonResponse(res, 400, { error: err.message });
      }
    });
    return;
  }

  if (path === '/api/workshop/synthesize' && req.method === 'POST') {
    readBody(req).then((body) => {
      try {
        const result = holographicWorkshop.synthesizeHologram(body.prompt || '');
        jsonResponse(res, 200, result);
      } catch (err) {
        jsonResponse(res, 400, { error: err.message });
      }
    });
    return;
  }

  // PRD v1.0 Workspace Management & Action Architecture Endpoints
  if (path === '/api/workshop/workspaces' && req.method === 'GET') {
    jsonResponse(res, 200, holographicWorkshop.listWorkspaces());
    return;
  }

  if (path === '/api/workshop/workspaces' && req.method === 'POST') {
    readBody(req).then((body) => {
      try {
        const ws = holographicWorkshop.createWorkspace(body.name, body.description, body.category);
        jsonResponse(res, 201, ws);
      } catch (err) {
        jsonResponse(res, 400, { error: err.message });
      }
    });
    return;
  }

  if (path.startsWith('/api/workshop/workspaces/') && req.method === 'GET') {
    const parts = path.split('/');
    const wsId = parts[4];
    if (parts.length === 5) {
      try {
        jsonResponse(res, 200, holographicWorkshop.getWorkspace(wsId));
      } catch (err) {
        jsonResponse(res, 404, { error: err.message });
      }
      return;
    } else if (parts[5] === 'explain') {
      try {
        jsonResponse(res, 200, holographicWorkshop.explainSystem(wsId));
      } catch (err) {
        jsonResponse(res, 404, { error: err.message });
      }
      return;
    } else if (parts[5] === 'objects' && parts[7] === 'explain') {
      try {
        jsonResponse(res, 200, holographicWorkshop.explainObject(wsId, parts[6]));
      } catch (err) {
        jsonResponse(res, 404, { error: err.message });
      }
      return;
    }
  }

  if (path.match(/^\/api\/workshop\/workspaces\/[^/]+\/action$/) && req.method === 'POST') {
    const wsId = path.split('/')[4];
    readBody(req).then(async (body) => {
      try {
        const result = await holographicWorkshop.executeAction({ ...body, workspace_id: wsId });
        jsonResponse(res, 200, { success: true, result });
      } catch (err) {
        jsonResponse(res, 400, { error: err.message });
      }
    });
    return;
  }

  if (path.match(/^\/api\/workshop\/workspaces\/[^/]+\/command$/) && req.method === 'POST') {
    const wsId = path.split('/')[4];
    readBody(req).then(async (body) => {
      try {
        const result = await holographicWorkshop.processNaturalLanguageCommand(wsId, body.command || '');
        jsonResponse(res, 200, { success: true, ...result });
      } catch (err) {
        jsonResponse(res, 400, { error: err.message });
      }
    });
    return;
  }

  if (path.match(/^\/api\/workshop\/workspaces\/[^/]+$/) && (req.method === 'POST' || req.method === 'PUT')) {
    const wsId = path.split('/')[4];
    readBody(req).then((body) => {
      try {
        const saved = holographicWorkshop.saveWorkspace(wsId, body);
        jsonResponse(res, 200, { success: true, workspace: saved });
      } catch (err) {
        jsonResponse(res, 400, { error: err.message });
      }
    });
    return;
  }

  if (path.startsWith('/api/workshop/workspaces/') && req.method === 'DELETE') {
    const wsId = path.split('/')[4];
    try {
      const deleted = holographicWorkshop.deleteWorkspace(wsId);
      jsonResponse(res, 200, { success: deleted });
    } catch (err) {
      jsonResponse(res, 400, { error: err.message });
    }
    return;
  }

  // Aura State Integration (PRD Section 14)
  if (path === '/api/workshop/agent/state' && req.method === 'GET') {
    jsonResponse(res, 200, holographicWorkshop.getAgentState());
    return;
  }

  // Agent-to-Agent (A2A) Communication Endpoint (PRD Section 17)
  if (path === '/api/workshop/a2a/request' && req.method === 'POST') {
    readBody(req).then(async (body) => {
      try {
        const response = await holographicWorkshop.handleA2ARequest(body);
        jsonResponse(res, 200, response);
      } catch (err) {
        jsonResponse(res, 400, { error: err.message });
      }
    });
    return;
  }

  // ── Holographic Workshop Dataset Pack v1/v2/v3 Endpoints ──
  if (path === '/api/workshop/datasets/stats' && req.method === 'GET') {
    jsonResponse(res, 200, holographicWorkshop.holographicDatasetService.getStats());
    return;
  }

  if (path === '/api/workshop/datasets/objects' && req.method === 'GET') {
    const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const q = urlObj.searchParams.get('q') || '';
    const category = urlObj.searchParams.get('category') || '';
    const baseType = urlObj.searchParams.get('base_type') || '';
    const limit = parseInt(urlObj.searchParams.get('limit') || '30', 10);
    const offset = parseInt(urlObj.searchParams.get('offset') || '0', 10);
    const results = holographicWorkshop.holographicDatasetService.searchObjects({ query: q, category, baseType, limit, offset });
    jsonResponse(res, 200, results);
    return;
  }

  if (path.startsWith('/api/workshop/datasets/objects/') && req.method === 'GET') {
    const id = path.split('/')[5];
    const obj = holographicWorkshop.holographicDatasetService.getObject(id);
    if (obj) jsonResponse(res, 200, obj);
    else jsonResponse(res, 404, { error: `Object ${id} not found` });
    return;
  }

  if (path === '/api/workshop/datasets/systems' && req.method === 'GET') {
    const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const q = urlObj.searchParams.get('q') || '';
    const domain = urlObj.searchParams.get('domain') || '';
    const limit = parseInt(urlObj.searchParams.get('limit') || '20', 10);
    const offset = parseInt(urlObj.searchParams.get('offset') || '0', 10);
    const results = holographicWorkshop.holographicDatasetService.searchSystems({ query: q, domain, limit, offset });
    jsonResponse(res, 200, results);
    return;
  }

  if (path.startsWith('/api/workshop/datasets/systems/') && req.method === 'GET') {
    const id = path.split('/')[5];
    const sys = holographicWorkshop.holographicDatasetService.getSystem(id);
    if (sys) jsonResponse(res, 200, sys);
    else jsonResponse(res, 404, { error: `System ${id} not found` });
    return;
  }

  if (path.match(/^\/api\/workshop\/datasets\/systems\/[^/]+\/instantiate$/) && req.method === 'POST') {
    const sysId = path.split('/')[5];
    try {
      const newWs = holographicWorkshop.holographicDatasetService.instantiateRecipeWorkspace(sysId);
      holographicWorkshop.saveWorkspace(newWs.workspace_id, newWs);
      holographicWorkshop.setActiveWorkspaceId(newWs.workspace_id);
      jsonResponse(res, 201, { success: true, workspace: newWs });
    } catch (err) {
      jsonResponse(res, 400, { error: err.message });
    }
    return;
  }

  if (path === '/api/workshop/datasets/materials' && req.method === 'GET') {
    jsonResponse(res, 200, holographicWorkshop.holographicDatasetService.listMaterials());
    return;
  }

  if (path === '/api/workshop/datasets/schemas' && req.method === 'GET') {
    jsonResponse(res, 200, holographicWorkshop.holographicDatasetService.listSimulationSchemas());
    return;
  }

  if (path === '/api/workshop/datasets/units' && req.method === 'GET') {
    jsonResponse(res, 200, holographicWorkshop.holographicDatasetService.listUnits());
    return;
  }

  // ── V4 Advanced Domains: Elements (118), Nanomaterials (100), Robotics (100), Exosuits (10) ──
  if (path === '/api/workshop/datasets/elements' && req.method === 'GET') {
    const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const q = urlObj.searchParams.get('q') || '';
    const limit = parseInt(urlObj.searchParams.get('limit') || '30', 10);
    jsonResponse(res, 200, holographicWorkshop.holographicDatasetService.searchElements(q, limit));
    return;
  }

  if (path.startsWith('/api/workshop/datasets/elements/') && req.method === 'GET') {
    const symOrNum = path.split('/')[5];
    const el = holographicWorkshop.holographicDatasetService.getElement(symOrNum);
    if (el) jsonResponse(res, 200, el);
    else jsonResponse(res, 404, { error: `Element ${symOrNum} not found` });
    return;
  }

  if (path === '/api/workshop/datasets/nanomaterials' && req.method === 'GET') {
    const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const q = urlObj.searchParams.get('q') || '';
    const limit = parseInt(urlObj.searchParams.get('limit') || '30', 10);
    jsonResponse(res, 200, holographicWorkshop.holographicDatasetService.searchNanomaterials(q, limit));
    return;
  }

  if (path === '/api/workshop/datasets/robotics' && req.method === 'GET') {
    const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const q = urlObj.searchParams.get('q') || '';
    const limit = parseInt(urlObj.searchParams.get('limit') || '30', 10);
    jsonResponse(res, 200, holographicWorkshop.holographicDatasetService.searchRobotics(q, limit));
    return;
  }

  if (path === '/api/workshop/datasets/exosuits' && req.method === 'GET') {
    jsonResponse(res, 200, holographicWorkshop.holographicDatasetService.listExosuits());
    return;
  }

  // ── Advanced Technologies & Materials (dataset.json: 41 items) ──
  if ((path === '/api/workshop/datasets/advanced-tech' || path === '/api/workshop/datasets/tech-materials') && req.method === 'GET') {
    const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const q = urlObj.searchParams.get('q') || '';
    const category = urlObj.searchParams.get('category') || '';
    const subcategory = urlObj.searchParams.get('subcategory') || '';
    const limit = parseInt(urlObj.searchParams.get('limit') || '50', 10);
    const offset = parseInt(urlObj.searchParams.get('offset') || '0', 10);
    jsonResponse(res, 200, holographicWorkshop.holographicDatasetService.searchTechMaterials({ query: q, category, subcategory, limit, offset }));
    return;
  }

  if ((path.startsWith('/api/workshop/datasets/advanced-tech/') || path.startsWith('/api/workshop/datasets/tech-materials/')) && req.method === 'GET') {
    const id = path.split('/')[5];
    const item = holographicWorkshop.holographicDatasetService.getTechMaterial(id);
    if (item) jsonResponse(res, 200, item);
    else jsonResponse(res, 404, { error: `Tech/Material item ${id} not found` });
    return;
  }

  // ── V5 Scientific Knowledge Graph Endpoints ──
  if (path === '/api/workshop/datasets/knowledge-graph' && req.method === 'GET') {
    const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const q = urlObj.searchParams.get('q') || '';
    const domain = urlObj.searchParams.get('domain') || '';
    const type = urlObj.searchParams.get('type') || '';
    const limit = parseInt(urlObj.searchParams.get('limit') || '50', 10);
    jsonResponse(res, 200, holographicWorkshop.holographicDatasetService.queryKnowledgeGraph({ query: q, domain, type, limit }));
    return;
  }

  if (path.startsWith('/api/workshop/datasets/knowledge-graph/') && req.method === 'GET') {
    const entityId = decodeURIComponent(path.split('/')[5] || '');
    const data = holographicWorkshop.holographicDatasetService.getKnowledgeGraphNeighbors(entityId);
    jsonResponse(res, 200, data);
    return;
  }

  // ── Agent Tool Routing Evaluation Benchmark (100 Test Cases) ──
  if (path === '/api/workshop/datasets/eval' && req.method === 'GET') {
    jsonResponse(res, 200, holographicWorkshop.holographicDatasetService.runToolEvalBenchmark());
    return;
  }

  if (path === '/api/workshop/datasets/eval/run' && req.method === 'POST') {
    const result = holographicWorkshop.holographicDatasetService.runToolEvalBenchmark();
    jsonResponse(res, 200, { success: true, benchmark: result });
    return;
  }

  // ── V5 Knowledge Graph Search, Path Finding, and Material Comparison ──
  if (path === '/api/workshop/knowledge/search' && req.method === 'GET') {
    const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const q = urlObj.searchParams.get('q') || '';
    const category = urlObj.searchParams.get('category') || '';
    jsonResponse(res, 200, holographicWorkshop.KnowledgeGraphService.searchKnowledge(q, category));
    return;
  }

  if (path === '/api/workshop/knowledge/path' && req.method === 'GET') {
    const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const source = urlObj.searchParams.get('source') || urlObj.searchParams.get('src') || '';
    const target = urlObj.searchParams.get('target') || urlObj.searchParams.get('tgt') || '';
    jsonResponse(res, 200, holographicWorkshop.KnowledgeGraphService.findSemanticPath(source, target));
    return;
  }

  if (path === '/api/workshop/knowledge/compare' && req.method === 'GET') {
    const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const matA = urlObj.searchParams.get('material_a') || urlObj.searchParams.get('matA') || 'steel';
    const matB = urlObj.searchParams.get('material_b') || urlObj.searchParams.get('matB') || 'aluminum';
    jsonResponse(res, 200, holographicWorkshop.KnowledgeGraphService.compareMaterials(matA, matB));
    return;
  }

  if (path.startsWith('/api/workshop/knowledge/provenance/') && req.method === 'GET') {
    const entityId = decodeURIComponent(path.split('/')[5] || '');
    jsonResponse(res, 200, holographicWorkshop.KnowledgeGraphService.getProvenance(entityId));
    return;
  }

  // Structured Agent-to-Agent Protocol Endpoint
  if (path === '/api/workshop/agent/request' && req.method === 'POST') {
    readBody(req).then(async (body) => {
      try {
        const response = await holographicWorkshop.AgentCommunicator.handleAuraRequest(body);
        jsonResponse(res, response.status === 'error' ? 400 : 200, response);
      } catch (err) {
        jsonResponse(res, 500, { status: 'error', error: err.message });
      }
    });
    return;
  }

  // External service proxy endpoints
  if (path === '/api/proxy/forge' && req.method === 'GET') {
    handleProxy('forge', 'http://localhost:4000/health', req, res);
    return;
  }

  if (path === '/api/proxy/sentinel' && req.method === 'GET') {
    handleProxy('sentinel', 'http://localhost:8000/health', req, res);
    return;
  }

  // Cyber Guardian API endpoints
  if (path === '/api/cyber-guardian/status' && req.method === 'GET') {
    jsonResponse(res, 200, cyberGuardian.getSecurityStatus());
    return;
  }

  if (path === '/api/cyber-guardian/range/start' && req.method === 'POST') {
    try {
      jsonResponse(res, 200, cyberGuardian.startCyberRange());
    } catch (e) {
      jsonResponse(res, 400, { error: e.message });
    }
    return;
  }

  if (path === '/api/cyber-guardian/range/stop' && req.method === 'POST') {
    try {
      const body = await readBody(req);
      const { environmentId } = JSON.parse(body || '{}');
      jsonResponse(res, 200, cyberGuardian.stopCyberRange(environmentId));
    } catch (e) {
      jsonResponse(res, 400, { error: e.message });
    }
    return;
  }

  if (path === '/api/cyber-guardian/experiments/run' && req.method === 'POST') {
    try {
      const body = await readBody(req);
      const config = body ? JSON.parse(body) : undefined;
      const report = await cyberGuardian.runExperiment(config);
      jsonResponse(res, 200, report);
    } catch (e) {
      jsonResponse(res, 400, { error: e.message });
    }
    return;
  }

  if (path === '/api/cyber-guardian/experiments' && req.method === 'GET') {
    jsonResponse(res, 200, { experiments: cyberGuardian.listExperiments() });
    return;
  }

  if (path === '/api/cyber-guardian/reports' && req.method === 'GET') {
    jsonResponse(res, 200, { reports: cyberGuardian.listReports() });
    return;
  }

  if (path.match(/^\/api\/cyber-guardian\/reports\/[^/]+$/) && req.method === 'GET') {
    const reportId = path.split('/')[4];
    const report = cyberGuardian.getReport(reportId);
    if (!report) {
      jsonResponse(res, 404, { error: 'Report not found' });
      return;
    }
    jsonResponse(res, 200, report);
    return;
  }

  if (path === '/api/cyber-guardian/kill-switch' && req.method === 'POST') {
    try {
      const body = await readBody(req);
      const { active, reason } = JSON.parse(body || '{}');
      jsonResponse(res, 200, cyberGuardian.setKillSwitch(active !== false, 'api', reason || ''));
    } catch (e) {
      jsonResponse(res, 400, { error: e.message });
    }
    return;
  }

  if (path === '/api/cyber-guardian/audit' && req.method === 'GET') {
    jsonResponse(res, 200, { audit: cyberGuardian.getAuditLog() });
    return;
  }

  if (path === '/api/cyber-guardian/command' && req.method === 'POST') {
    try {
      const body = await readBody(req);
      const { command } = JSON.parse(body || '{}');
      const result = await cyberGuardian.handleNaturalLanguageCommand(command || '');
      jsonResponse(res, 200, result);
    } catch (e) {
      jsonResponse(res, 400, { error: e.message });
    }
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
}

const server = http.createServer(async (req, res) => {
  // Proxy Forge paths
  if (req.url.startsWith('/Forge/') || req.url.startsWith('/Forge')) {
    const cleanUrl = req.url.split('?')[0];
    if (cleanUrl === '/Forge' || cleanUrl === '/Forge/') {
      req.url = '/Forge/';
    }
    // Route /Forge/api/backend/* to Forge API, everything else to Forge Web
    if (req.url.startsWith('/Forge/api/backend/')) {
      await handlePathProxy('forge-api', FORGE_API_URL, req, res);
    } else {
      await handlePathProxy('forge-web', FORGE_WEB_URL, req, res);
    }
    return;
  }

  // Proxy Sentinel paths
  if (req.url.startsWith('/sentinel/') || req.url.startsWith('/sentinel')) {
    const cleanUrl = req.url.split('?')[0];
    if (cleanUrl === '/sentinel' || cleanUrl === '/sentinel/') {
      req.url = '/sentinel/';
    }
    // Route /sentinel/api/* to Sentinel API, everything else to Sentinel Web
    if (req.url.startsWith('/sentinel/api/')) {
      await handlePathProxy('sentinel-api', SENTINEL_API_URL, req, res);
    } else {
      await handlePathProxy('sentinel-web', SENTINEL_WEB_URL, req, res);
    }
    return;
  }

  if (req.url.startsWith('/api/')) {
    handleAPI(req, res);
    return;
  }

  const cleanUrl = req.url.split('?')[0];
  if (cleanUrl === '/workshop' || cleanUrl === '/workshop/') {
    await serveStatic(req, res, join(PUBLIC_DIR, 'workshop.html'));
    return;
  }

  // AURA V2 SPA routes - serve index.html
  const SPA_ROUTES = [
    '/',
    '/chat',
    '/workspace',
    '/missions',
    '/intelligence',
    '/data',
    '/creative',
    '/automation',
    '/security',
    '/devices',
    '/settings'
  ];
  if (SPA_ROUTES.includes(cleanUrl)) {
    await serveStatic(req, res, join(PUBLIC_DIR, 'index.html'));
    return;
  }

  let filePath = join(PUBLIC_DIR, req.url === '/' ? 'index.html' : req.url);

  const ext = extname(filePath).toLowerCase();
  if (!ext) {
    filePath = join(filePath, 'index.html');
  }

  await serveStatic(req, res, filePath);
});

// Skills storage
const skillsStore = new Map();
const SKILLS_FILE = join(DATA_DIR, 'skills-data.json');

async function loadSkillsData() {
  try {
    const data = await readFile(SKILLS_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    for (const skill of parsed) {
      skillsStore.set(skill.id, skill);
    }
    console.log(`Loaded ${skillsStore.size} skills`);
  } catch (e) {
    console.log('No existing skills data, initializing with defaults');
    await initializeDefaultSkills();
  }
}

async function saveSkillsData() {
  try {
    const skills = Array.from(skillsStore.values());
    await writeFile(SKILLS_FILE, JSON.stringify(skills, null, 2));
  } catch (e) {
    console.error('Failed to save skills data:', e);
  }
}

async function initializeDefaultSkills() {
  const defaultSkills = [
    {
      id: 'code-analysis',
      name: 'Code Analysis',
      version: '1.0.0',
      description: 'Analyzes code snippets for issues, best practices, and improvements',
      author: 'AURA Team',
      category: 'development',
      tags: ['code', 'analysis', 'lint', 'review'],
      permissions: [
        { type: 'model', scope: ['analysis'], description: 'Uses AI model for code analysis' },
        { type: 'filesystem', scope: ['read'], description: 'Reads code files for analysis' }
      ],
      configSchema: {
        type: 'object',
        properties: {
          autoAnalyze: { type: 'boolean', description: 'Automatically analyze code blocks', default: true },
          severityThreshold: { type: 'string', description: 'Minimum severity to report', enum: ['info', 'warning', 'error'], default: 'warning' },
          languages: { type: 'array', description: 'Supported languages', default: ['typescript', 'javascript', 'python', 'go', 'rust'] }
        }
      },
      defaultConfig: { autoAnalyze: true, severityThreshold: 'warning', languages: ['typescript', 'javascript', 'python', 'go', 'rust'] },
      enabled: true
    },
    {
      id: 'task-automation',
      name: 'Task Automation',
      version: '1.0.0',
      description: 'Automates repetitive tasks and workflows',
      author: 'AURA Team',
      category: 'productivity',
      tags: ['automation', 'workflow', 'tasks', 'scheduler'],
      permissions: [
        { type: 'shell', scope: ['execute'], description: 'Runs automation scripts' },
        { type: 'filesystem', scope: ['read', 'write'], description: 'Manages task files and scripts' },
        { type: 'api', scope: ['forge'], description: 'Triggers FORGE runs' }
      ],
      configSchema: {
        type: 'object',
        properties: {
          maxConcurrentTasks: { type: 'number', description: 'Max concurrent tasks', default: 3 },
          defaultTimeout: { type: 'number', description: 'Default timeout (ms)', default: 300000 },
          retryAttempts: { type: 'number', description: 'Retry attempts', default: 2 }
        }
      },
      defaultConfig: { maxConcurrentTasks: 3, defaultTimeout: 300000, retryAttempts: 2 },
      enabled: true
    },
    {
      id: 'security-audit',
      name: 'Security Audit',
      version: '1.0.0',
      description: 'Scans for security vulnerabilities and compliance issues',
      author: 'AURA Team',
      category: 'security',
      tags: ['security', 'audit', 'vulnerability', 'compliance', 'sentinel'],
      permissions: [
        { type: 'api', scope: ['sentinel'], description: 'Integrates with SENTINEL for security scanning' },
        { type: 'shell', scope: ['semgrep', 'gitleaks', 'trivy'], description: 'Runs security scanners' },
        { type: 'filesystem', scope: ['read'], description: 'Scans codebase for vulnerabilities' }
      ],
      configSchema: {
        type: 'object',
        properties: {
          scanOnSave: { type: 'boolean', description: 'Scan on file save', default: false },
          severityFilter: { type: 'string', description: 'Minimum severity', enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
          scanners: { type: 'array', description: 'Enabled scanners', default: ['semgrep', 'gitleaks', 'trivy', 'npm-audit'] },
          autoRemediate: { type: 'boolean', description: 'Auto-remediate issues', default: false }
        }
      },
      defaultConfig: { scanOnSave: false, severityFilter: 'medium', scanners: ['semgrep', 'gitleaks', 'trivy', 'npm-audit'], autoRemediate: false },
      enabled: true
    },
    {
      id: 'data-analysis',
      name: 'Data Analysis',
      version: '1.0.0',
      description: 'Performs data analysis, visualization, and insights generation',
      author: 'AURA Team',
      category: 'analysis',
      tags: ['data', 'analytics', 'visualization', 'statistics', 'ml'],
      permissions: [
        { type: 'model', scope: ['analysis'], description: 'Uses AI for data insights' },
        { type: 'filesystem', scope: ['read', 'write'], description: 'Processes data files' },
        { type: 'shell', scope: ['python', 'jupyter'], description: 'Runs data analysis scripts' }
      ],
      configSchema: {
        type: 'object',
        properties: {
          defaultFormat: { type: 'string', description: 'Default data format', default: 'csv' },
          maxRows: { type: 'number', description: 'Max rows to process', default: 100000 },
          enableML: { type: 'boolean', description: 'Enable ML features', default: false }
        }
      },
      defaultConfig: { defaultFormat: 'csv', maxRows: 100000, enableML: false },
      enabled: true
    },
    {
      id: 'documentation',
      name: 'Documentation Generator',
      version: '1.0.0',
      description: 'Generates and maintains documentation from code',
      author: 'AURA Team',
      category: 'development',
      tags: ['documentation', 'docs', 'readme', 'api-docs', 'comments'],
      permissions: [
        { type: 'model', scope: ['generation'], description: 'Generates documentation using AI' },
        { type: 'filesystem', scope: ['read', 'write'], description: 'Reads code and writes docs' }
      ],
      configSchema: {
        type: 'object',
        properties: {
          formats: { type: 'array', description: 'Output formats', default: ['markdown', 'jsdoc', 'openapi'] },
          includeExamples: { type: 'boolean', description: 'Include code examples', default: true },
          updateOnChange: { type: 'boolean', description: 'Auto-update on code changes', default: false }
        }
      },
      defaultConfig: { formats: ['markdown', 'jsdoc', 'openapi'], includeExamples: true, updateOnChange: false },
      enabled: true
    }
  ];

  for (const skill of defaultSkills) {
    skillsStore.set(skill.id, skill);
  }
  await saveSkillsData();
}

async function handleGetSkills(req, res) {
  if (skillsStore.size <= 5) {
    await loadSkillsData();
  }
  const skills = Array.from(skillsStore.values());
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ skills }));
}

async function handleReloadSkills(req, res) {
  await loadSkillsData();
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: true, count: skillsStore.size }));
}

async function handleGetSkill(req, res) {
  const id = req.url.split('/').pop();
  if (skillsStore.size <= 5) {
    await loadSkillsData();
  }
  const skill = skillsStore.get(id);
  if (skill) {
    let skillContent = null;
    const skillPath = join(__dirname, 'skills', id, 'SKILL.md');
    try {
      skillContent = await readFile(skillPath, 'utf-8');
    } catch (_) {}
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ...skill, markdown: skillContent }));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Skill not found' }));
  }
}

async function handleInstallSkill(req, res) {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', async () => {
    try {
      const data = JSON.parse(body || '{}');
      let skill;
      
      if (data.template) {
        const templateSkill = skillsStore.get(data.template);
        if (!templateSkill) {
          res.writeHead(404);
          res.end(JSON.stringify({ error: 'Template not found' }));
          return;
        }
        skill = { ...templateSkill, id: `${data.template}-${Date.now()}`, installedAt: new Date().toISOString() };
      } else if (data.url) {
        skill = {
          id: `skill-${Date.now()}`,
          name: 'Custom Skill from URL',
          version: '1.0.0',
          description: `Installed from ${data.url}`,
          author: 'External',
          category: 'custom',
          tags: ['custom'],
          permissions: [],
          configSchema: { type: 'object', properties: {} },
          defaultConfig: {},
          enabled: true,
          sourceUrl: data.url,
          installedAt: new Date().toISOString()
        };
      } else if (data.manifest) {
        skill = { ...data.manifest, id: data.manifest.id || `skill-${Date.now()}`, installedAt: new Date().toISOString() };
      } else if (data.custom) {
        skill = {
          id: data.custom.id,
          name: data.custom.name,
          version: '1.0.0',
          description: data.custom.description,
          author: 'User',
          category: data.custom.category,
          tags: ['custom'],
          permissions: [],
          configSchema: { type: 'object', properties: {} },
          defaultConfig: {},
          enabled: true,
          code: data.custom.code,
          installedAt: new Date().toISOString()
        };
      } else {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid install data' }));
        return;
      }
      
      if (skillsStore.has(skill.id)) {
        res.writeHead(409);
        res.end(JSON.stringify({ error: 'Skill already exists' }));
        return;
      }
      
      skillsStore.set(skill.id, skill);
      await saveSkillsData();
      res.writeHead(201);
      res.end(JSON.stringify({ success: true, skill }));
    } catch (error) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: error.message }));
    }
  });
}

async function handleEnableSkill(req, res) {
  const id = req.url.split('/')[3];
  const skill = skillsStore.get(id);
  if (!skill) {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Skill not found' }));
    return;
  }
  skill.enabled = true;
  await saveSkillsData();
  res.writeHead(200);
  res.end(JSON.stringify({ success: true, skill }));
}

async function handleDisableSkill(req, res) {
  const id = req.url.split('/')[3];
  const skill = skillsStore.get(id);
  if (!skill) {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Skill not found' }));
    return;
  }
  skill.enabled = false;
  await saveSkillsData();
  res.writeHead(200);
  res.end(JSON.stringify({ success: true, skill }));
}

async function handleUpdateSkillConfig(req, res) {
  const id = req.url.split('/')[3];
  const skill = skillsStore.get(id);
  if (!skill) {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Skill not found' }));
    return;
  }
  
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', async () => {
    try {
      const config = JSON.parse(body || '{}');
      skill.config = { ...skill.defaultConfig, ...skill.config, ...config };
      await saveSkillsData();
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, skill }));
    } catch (error) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: error.message }));
    }
  });
}

async function handleRemoveSkill(req, res) {
  const id = req.url.split('/').pop();
  if (skillsStore.delete(id)) {
    await saveSkillsData();
    res.writeHead(200);
    res.end(JSON.stringify({ success: true }));
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Skill not found' }));
  }
}

await loadLearningData();
await loadSkillsData();

server.listen(PORT, () => {
  const modelId = getModelId(DEFAULT_MODEL);
  console.log(`AURA is online at http://localhost:${PORT}`);
  if (process.env.OPENROUTER_API_KEY) {
    console.log(`🟢 Live OpenRouter AI (${modelId}) mode`);
  } else {
    console.log('⚠️  OPENROUTER_API_KEY not set - running in local demo mode');
  }
});

function jsonResponse(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

async function readBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => resolve(body ? JSON.parse(body) : {}));
  });
}

function handleCreateMission(req, res) {
  readBody(req).then(async (body) => {
    const { objective, projectId, metadata = {} } = body;
    if (!objective) {
      res.writeHead(400);
      res.end(JSON.stringify({ error: 'objective is required' }));
      return;
    }

    const mission = {
      id: generateMissionId(),
      objective,
      status: 'CREATED',
      projectId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      goals: [],
      metadata
    };

    missions.set(mission.id, mission);
    res.writeHead(201);
    res.end(JSON.stringify(mission));
  });
}

function handleListMissions(req, res) {
  const missionList = Array.from(missions.values());
  res.writeHead(200);
  res.end(JSON.stringify(missionList));
}

function handleGetMission(req, res, missionId) {
  const mission = missions.get(missionId);
  if (!mission) {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Mission not found' }));
    return;
  }

  const missionTasks = Array.from(tasks.values()).filter(t => t.missionId === missionId);
  const missionFindings = Array.from(findings.values()).filter(f => f.missionId === missionId);
  const missionApprovals = Array.from(approvals.values()).filter(a => a.missionId === missionId);

  res.writeHead(200);
  res.end(JSON.stringify({
    ...mission,
    tasks: missionTasks,
    findings: missionFindings,
    approvals: missionApprovals
  }));
}

function handlePauseMission(req, res, missionId) {
  const mission = missions.get(missionId);
  if (!mission) {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Mission not found' }));
    return;
  }

  mission.status = 'PAUSED';
  mission.updatedAt = new Date().toISOString();
  missions.set(missionId, mission);

  res.writeHead(200);
  res.end(JSON.stringify(mission));
}

function handleResumeMission(req, res, missionId) {
  const mission = missions.get(missionId);
  if (!mission) {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Mission not found' }));
    return;
  }

  mission.status = 'RUNNING';
  mission.updatedAt = new Date().toISOString();
  if (!mission.startedAt) mission.startedAt = new Date().toISOString();
  missions.set(missionId, mission);

  res.writeHead(200);
  res.end(JSON.stringify(mission));
}

function handleCancelMission(req, res, missionId) {
  const mission = missions.get(missionId);
  if (!mission) {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Mission not found' }));
    return;
  }

  mission.status = 'CANCELLED';
  mission.updatedAt = new Date().toISOString();
  mission.completedAt = new Date().toISOString();
  missions.set(missionId, mission);

  const missionTasks = Array.from(tasks.values()).filter(t => t.missionId === missionId);
  for (const task of missionTasks) {
    if (['CREATED', 'ANALYZING', 'PLANNED', 'APPROVED'].includes(task.status)) {
      task.status = 'CANCELLED';
      task.updatedAt = new Date().toISOString();
      tasks.set(task.id, task);
    }
  }

  res.writeHead(200);
  res.end(JSON.stringify(mission));
}

function handleGetMissionTasks(req, res, missionId) {
  const missionTasks = Array.from(tasks.values()).filter(t => t.missionId === missionId);
  res.writeHead(200);
  res.end(JSON.stringify(missionTasks));
}

function handleGetMissionFindings(req, res, missionId) {
  const missionFindings = Array.from(findings.values()).filter(f => f.missionId === missionId);
  res.writeHead(200);
  res.end(JSON.stringify(missionFindings));
}

function handleListApprovals(req, res) {
  const approvalList = Array.from(approvals.values());
  res.writeHead(200);
  res.end(JSON.stringify(approvalList));
}

function handleApproveApproval(req, res, approvalId) {
  const approval = approvals.get(approvalId);
  if (!approval) {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Approval not found' }));
    return;
  }

  approval.status = 'APPROVED';
  approval.resolvedAt = new Date().toISOString();
  approval.resolvedBy = 'user';
  approvals.set(approvalId, approval);

  res.writeHead(200);
  res.end(JSON.stringify(approval));
}

function handleRejectApproval(req, res, approvalId) {
  const approval = approvals.get(approvalId);
  if (!approval) {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Approval not found' }));
    return;
  }

  approval.status = 'REJECTED';
  approval.resolvedAt = new Date().toISOString();
  approval.resolvedBy = 'user';
  approvals.set(approvalId, approval);

  res.writeHead(200);
  res.end(JSON.stringify(approval));
}

function handleListFindings(req, res) {
  const findingList = Array.from(findings.values());
  res.writeHead(200);
  res.end(JSON.stringify(findingList));
}

function handleRemediateFinding(req, res, findingId) {
  const finding = findings.get(findingId);
  if (!finding) {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Finding not found' }));
    return;
  }

  finding.status = 'IN_PROGRESS';
  finding.verificationState = 'UNVERIFIED';
  finding.updatedAt = new Date().toISOString();
  findings.set(findingId, finding);

  const remediationTask = {
    id: generateTaskId(),
    missionId: finding.missionId,
    type: 'REMEDIATION',
    title: `Remediate finding ${findingId}`,
    description: `Fix security issue: ${finding.title}`,
    assignedAgent: 'FORGE',
    capabilities: ['PATCH_GENERATION', 'FAILURE_ANALYSIS'],
    dependencies: [],
    status: 'CREATED',
    requiredPermissions: ['filesystem.workspace.write', 'git.commit'],
    requiresApproval: false,
    riskLevel: 'MEDIUM',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  tasks.set(remediationTask.id, remediationTask);

  res.writeHead(200);
  res.end(JSON.stringify({ finding, remediationTask }));
}

async function handleLearningFeedback(req, res) {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', async () => {
    try {
      const { input, expectedOutput, actualOutput, rating, tags } = JSON.parse(body || '{}');
      if (!input || rating === undefined) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'input and rating required' }));
        return;
      }
      const entry = addLearningEntry(input, expectedOutput || '', actualOutput || '', rating, tags || []);
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, entry }));
    } catch (error) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: error.message }));
    }
  });
}

function handleGetLearningEntries(req, res) {
  const entries = Array.from(learningStore.values())
    .sort((a, b) => b.timestamp - a.timestamp);
  res.writeHead(200);
  res.end(JSON.stringify(entries));
}

function handleDeleteLearningEntry(req, res) {
  const id = req.url.split('/').pop();
  if (learningStore.delete(id)) {
    saveLearningData();
    res.writeHead(200);
    res.end(JSON.stringify({ success: true }));
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Entry not found' }));
  }
}

// ── AI Insights Handlers ──
function handleGetInsights(req, res) {
  const context = {
    currentModel: DEFAULT_MODEL,
    learningCount: learningStore.size,
    taskCount: tasks.size,
    missionCount: missions.size,
    findingCount: findings.size,
  };
  const data = insightsEngine.generateInsights(context);
  jsonResponse(res, 200, data);
}

async function handleExecuteInsightAction(req, res, insightId) {
  try {
    const body = await readBody(req);
    const { actionType, payload } = body || {};
    const result = await insightsEngine.executeAction(insightId, actionType, payload);
    jsonResponse(res, 200, result);
  } catch (e) {
    jsonResponse(res, 400, { error: e.message });
  }
}

function handleDismissInsight(req, res, insightId) {
  const result = insightsEngine.dismissInsight(insightId);
  jsonResponse(res, 200, result);
}

function handleResetInsights(req, res) {
  const result = insightsEngine.resetInsights();
  jsonResponse(res, 200, result);
}