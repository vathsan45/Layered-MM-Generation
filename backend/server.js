const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const prompts = require('./prompts');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Serve static frontend assets
app.use(express.static(path.join(__dirname, '../frontend')));

// Ensure projects directory exists
const PROJECTS_DIR = path.join(__dirname, 'projects');
if (!fs.existsSync(PROJECTS_DIR)) {
  fs.mkdirSync(PROJECTS_DIR, { recursive: true });
}

// Load Groq API Keys rotation pool from config/keys.json (git ignored for safety)
let GROQ_API_KEYS = [];
try {
  const keysPath = path.join(__dirname, 'config', 'keys.json');
  if (fs.existsSync(keysPath)) {
    const keysData = JSON.parse(fs.readFileSync(keysPath, 'utf8'));
    GROQ_API_KEYS = keysData.keys || [];
  }
} catch (err) {
  console.error('[WARN] Could not load rotation keys from config/keys.json:', err.message);
}

// Helper to call Groq with Key rotation
async function callGroqWithRotation(systemPrompt, userPrompt, model, customKey) {
  let keysToTry = [...GROQ_API_KEYS];
  if (customKey) {
    keysToTry.unshift(customKey);
  }
  
  let lastError = null;
  const startTime = Date.now();

  for (let i = 0; i < keysToTry.length; i++) {
    const key = keysToTry[i];
    const keyLabel = key === customKey ? 'Custom Key' : `Rotation Key #${i + (customKey ? 0 : 1)}`;
    console.log(`[SYS] Calling Groq API via ${keyLabel} using model ${model}...`);
    
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model || 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.1,
          max_tokens: 3000,
          response_format: { type: 'json_object' }
        })
      });

      if (response.status === 429) {
        console.warn(`[WARN] Rate limit (429) on ${keyLabel}. Rotating key...`);
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`[WARN] API Error (${response.status}) on ${keyLabel}: ${errorText}. Rotating...`);
        continue;
      }

      const data = await response.json();
      const durationMs = Date.now() - startTime;
      const content = data.choices[0].message.content;
      
      return {
        success: true,
        data: JSON.parse(content),
        stats: {
          durationMs,
          model: model || 'llama-3.3-70b-versatile',
          keyUsed: keyLabel,
          length: content.length
        }
      };
    } catch (err) {
      lastError = err;
      console.error(`[ERROR] Fetch error on ${keyLabel}: ${err.message}. Rotating...`);
    }
  }
  
  throw new Error(`All keys in the rotation pool failed. Last error: ${lastError ? lastError.message : 'Unknown'}`);
}

// REST API Endpoints

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', keys: GROQ_API_KEYS.length });
});

// Project Storage API
app.get('/api/projects', (req, res) => {
  try {
    const files = fs.readdirSync(PROJECTS_DIR);
    const projects = files
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const filePath = path.join(PROJECTS_DIR, file);
        const stats = fs.statSync(filePath);
        return {
          name: file.replace('.json', ''),
          updatedAt: stats.mtime
        };
      });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/projects/:name', (req, res) => {
  const filePath = path.join(PROJECTS_DIR, `${req.params.name}.json`);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Project not found' });
  }
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    res.send(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/projects/:name', (req, res) => {
  const filePath = path.join(PROJECTS_DIR, `${req.params.name}.json`);
  try {
    fs.writeFileSync(filePath, JSON.stringify(req.body, null, 2), 'utf8');
    res.json({ success: true, message: 'Project saved successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/projects/:name', (req, res) => {
  const filePath = path.join(PROJECTS_DIR, `${req.params.name}.json`);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Project not found' });
  }
  try {
    fs.unlinkSync(filePath);
    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LLM Sequential Generation Endpoints

// L2 - Contracts
app.post('/api/generate/contracts', async (req, res) => {
  const { graph, model, customApiKey } = req.body;
  try {
    const prompt = prompts.makeLayer2Prompt(graph);
    const systemPrompt = "You are a master story logic architect. Analyze the graph structures and produce a JSON map of node contracts. Follow the schema strictly.";
    const result = await callGroqWithRotation(systemPrompt, prompt, model, customApiKey);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// L3 - Premise Seed
app.post('/api/generate/premise', async (req, res) => {
  const { genre, tone, contracts, setting, model, customApiKey } = req.body;
  try {
    const prompt = prompts.makeLayer3Prompt(genre, tone, contracts, setting);
    const systemPrompt = "You are a creative novelist. Write a 1-paragraph seed for a mystery containing the setting, victim, scenario, and cast details.";
    const result = await callGroqWithRotation(systemPrompt, prompt, model, customApiKey);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// L3.5 - Truth Ledger
app.post('/api/generate/truth-ledger', async (req, res) => {
  const { graph, premise, contracts, setting, model, customApiKey } = req.body;
  try {
    const prompt = prompts.makeLayer3_5Prompt(graph, premise, contracts, setting);
    const systemPrompt = "You are a master story logic validator. Construct the complete world bible containing assets, truths, relationships, and candidate properties.";
    const result = await callGroqWithRotation(systemPrompt, prompt, model, customApiKey);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// L4 - Knowledge Ledger
app.post('/api/generate/knowledge-ledger', async (req, res) => {
  const { truthLedger, model, customApiKey } = req.body;
  try {
    const prompt = prompts.makeLayer4Prompt(truthLedger);
    const systemPrompt = "You are a detective narrative planner. Generate a temporal matrix representing what each character knew, when, and how, noting secrets.";
    const result = await callGroqWithRotation(systemPrompt, prompt, model, customApiKey);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// L4.5 - Evidence Ledger
app.post('/api/generate/evidence-ledger', async (req, res) => {
  const { truthLedger, knowledgeLedger, model, customApiKey } = req.body;
  try {
    const prompt = prompts.makeLayer4_5Prompt(truthLedger, knowledgeLedger);
    const systemPrompt = "You are a forensic mystery designer. Catalog the traces, files, messages, or tracks left in the world due to actions on knowledge.";
    const result = await callGroqWithRotation(systemPrompt, prompt, model, customApiKey);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// L5 - Allocation Ledger
app.post('/api/generate/allocation-ledger', async (req, res) => {
  const { graph, truthLedger, evidenceLedger, model, customApiKey } = req.body;
  try {
    const prompt = prompts.makeLayer5Prompt(graph, truthLedger, evidenceLedger);
    const systemPrompt = "You are a narrative editor. Allocate the facts and clues to nodes in the topology ensuring the false resolution occurs before invalidation.";
    const result = await callGroqWithRotation(systemPrompt, prompt, model, customApiKey);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// L6 - Node Prose
app.post('/api/generate/prose', async (req, res) => {
  const { nodeId, nodeLabel, nodeType, contract, worldBible, allocatedFacts, upstreamProse, genre, tone, setting, model, customApiKey } = req.body;
  try {
    const prompt = prompts.makeLayer6Prompt(nodeId, nodeLabel, nodeType, contract, worldBible, allocatedFacts, upstreamProse, genre, tone, setting);
    const systemPrompt = "You are a master mystery novelist writing a serial whodunit. Write the prose for the current node based strictly on the facts allocated, the node contract, and prior chapters.";
    const result = await callGroqWithRotation(systemPrompt, prompt, model, customApiKey);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// L7 - Consistency Verification
app.post('/api/generate/verify', async (req, res) => {
  const { storyProse, contracts, worldBible, knowledgeLedger, allocationLedger, model, customApiKey } = req.body;
  try {
    const prompt = prompts.makeLayer7Prompt(storyProse, contracts, worldBible, knowledgeLedger, allocationLedger);
    const systemPrompt = "You are a strict narrative editor and logical validator. Audit the prose against contracts, clues, and timelines, and report anomalies.";
    const result = await callGroqWithRotation(systemPrompt, prompt, model, customApiKey);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve frontend routing fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`[SYS] Server running on http://localhost:${PORT}`);
});
