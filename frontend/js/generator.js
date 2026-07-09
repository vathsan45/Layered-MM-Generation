(function() {
  'use strict';

  // State
  let customApiKey = localStorage.getItem('dte-custom-api-key') || '';
  window.activeSidebarTab = 'inspector';

  // Initialize generation state from autosave if present, or default
  let initialGenState = null;
  try {
    const saved = localStorage.getItem('dte-autosave');
    if (saved) {
      const d = JSON.parse(saved);
      if (d.genState) {
        initialGenState = d.genState;
      }
    }
  } catch (e) { /* ignore */ }

  const genState = initialGenState || {
    currentStep: 2,
    stepStatus: {
      2: 'ready',
      3: 'locked',
      3.5: 'locked',
      4: 'locked',
      4.5: 'locked',
      5: 'locked',
      6: 'locked',
      7: 'locked'
    },
    stepData: {
      2: null,
      3: null,
      3.5: null,
      4: null,
      4.5: null,
      5: null,
      6: {},
      7: null
    }
  };
  window.genState = genState; // Expose on window

  function openExportModal() {
    const host = document.getElementById('modal-host');
    host.innerHTML = '';
    
    const payload = JSON.parse(window.snapshot());
    const json = JSON.stringify(payload, null, 2);
    
    const back = document.createElement('div');
    back.className = 'modal-backdrop';
    const m = document.createElement('div');
    m.className = 'modal';
    m.innerHTML =
      '<h3>Export Project</h3>' +
      '<p>Copy this JSON to share or download the complete workspace backup.</p>' +
      '<textarea readonly id="m-text"></textarea>' +
      '<div class="row">' +
      '<button id="m-copy">Copy</button>' +
      '<button id="m-download">Download .json</button>' +
      '<button id="m-close" class="primary">Close</button>' +
      '</div>';
    back.appendChild(m); host.appendChild(back);
    document.getElementById('m-text').value = json;
    
    document.getElementById('m-close').addEventListener('click', () => { host.innerHTML = ''; });
    back.addEventListener('click', e => { if (e.target === back) host.innerHTML = ''; });
    
    document.getElementById('m-copy').addEventListener('click', () => {
      navigator.clipboard.writeText(json).then(() => {
        document.getElementById('m-copy').textContent = 'Copied';
        window.showToast('JSON copied to clipboard', 'success');
        setTimeout(() => { document.getElementById('m-copy').textContent = 'Copy'; }, 1500);
      });
    });
    
    document.getElementById('m-download').addEventListener('click', () => {
      const safeName = (window.state.name || 'project').replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = safeName + '_project.json'; a.click();
      URL.revokeObjectURL(url);
      window.showToast('Downloaded JSON file', 'success');
    });
  }

  // Register Export button
  const btnExport = document.getElementById('btn-export');
  if (btnExport) {
    btnExport.addEventListener('click', openExportModal);
  }

  // Helper to compile graph from editor window.state
  function getGraphForLLM() {
    return {
      name: window.state.name,
      dials: window.state.dials,
      nodes: window.state.nodes.map(n => ({
        id: n.id,
        type: n.type,
        label: n.label,
        streamId: n.streamId,
        notes: n.notes || ''
      })),
      edges: window.state.edges.map(e => ({
        id: e.id,
        source: e.src,
        target: e.tgt,
        type: e.type,
        notes: e.notes || ''
      })),
      streams: window.state.streams.map(s => ({
        id: s.id,
        name: s.name,
        type: s.type
      }))
    };
  }

  // Helper for topological sorting
  function getTopologicalOrder() {
    const order = [];
    const visited = new Set();
    const temp = new Set();
    
    const adj = {};
    window.state.nodes.forEach(n => adj[n.id] = []);
    window.state.edges.forEach(e => {
      if (e.type !== 'recontext' && adj[e.src]) {
        adj[e.src].push(e.tgt);
      }
    });

    function visit(nId) {
      if (temp.has(nId)) return;
      if (visited.has(nId)) return;
      
      temp.add(nId);
      const neighbors = adj[nId] || [];
      neighbors.forEach(neigh => visit(neigh));
      
      temp.delete(nId);
      visited.add(nId);
      order.unshift(nId);
    }

    window.state.nodes.forEach(n => {
      if (!visited.has(n.id)) {
        visit(n.id);
      }
    });
    
    return order;
  }

  // Terminal logging
  function appendTerminal(msg, type = 'log') {
    const term = document.getElementById('gen-terminal');
    if (!term) return;
    const time = new Date().toLocaleTimeString();
    const line = document.createElement('div');
    line.className = `t-${type}`;
    line.textContent = `[${time}] ${msg}`;
    term.appendChild(line);
    term.scrollTop = term.scrollHeight;
  }

  // Client API Caller connecting to Node.js Backend
  async function callBackendAPI(endpoint, bodyData) {
    const modelSelect = document.getElementById('gen-model');
    const model = modelSelect ? modelSelect.value : 'llama-3.3-70b-versatile';
    
    const reqBody = {
      ...bodyData,
      model,
      customApiKey
    };

    appendTerminal(`Executing pipeline endpoint: ${endpoint}...`, 'info');
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reqBody)
    });

    if (!response.ok) {
      const errText = await response.text();
      let serverErr = errText;
      try {
        const parsed = JSON.parse(errText);
        serverErr = parsed.error || errText;
      } catch (e) {}
      throw new Error(serverErr);
    }

    const resData = await response.json();
    const stats = resData.stats || {};
    appendTerminal(`Success! Duration: ${stats.durationMs}ms | Key: ${stats.keyUsed} | Size: ${stats.length} chars`, 'success');
    
    return resData.data;
  }

  // Sidebar Tab Switcher
  const tabInspector = document.getElementById('tab-inspector');
  const tabGenerator = document.getElementById('tab-generator');
  const inspectorContent = document.getElementById('inspector-tab-content');
  const generatorContent = document.getElementById('generator-tab-content');

  function selectTab(tab) {
    window.activeSidebarTab = tab;
    const sidebar = document.getElementById('sidebar');
    
    if (tab === 'inspector') {
      tabInspector.classList.add('active');
      tabGenerator.classList.remove('active');
      inspectorContent.style.display = 'block';
      generatorContent.style.display = 'none';
      sidebar.style.width = '300px';
      
      const toggle = document.getElementById('toggle-sidebar');
      if (toggle && !sidebar.classList.contains('collapsed')) {
        toggle.style.right = '312px';
      }
    } else {
      tabInspector.classList.remove('active');
      tabGenerator.classList.add('active');
      inspectorContent.style.display = 'none';
      generatorContent.style.display = 'flex';
      sidebar.style.width = '460px';
      
      const toggle = document.getElementById('toggle-sidebar');
      if (toggle && !sidebar.classList.contains('collapsed')) {
        toggle.style.right = '472px';
      }
    }
    
    window.adjustLayout();
  }

  tabInspector.addEventListener('click', () => selectTab('inspector'));
  tabGenerator.addEventListener('click', () => selectTab('generator'));

  // Custom API Key overrides
  const btnCustomKey = document.getElementById('btn-custom-key');
  btnCustomKey.addEventListener('click', () => {
    const key = prompt("Enter your Custom Groq API Key (leave empty to use rotating server fallbacks):", customApiKey);
    if (key !== null) {
      customApiKey = key.trim();
      if (customApiKey) {
        localStorage.setItem('dte-custom-api-key', customApiKey);
        document.getElementById('api-key-status').textContent = "Custom Key Active";
        document.getElementById('api-key-status').style.color = "var(--accent)";
        window.showToast("Custom API Key saved", "success");
      } else {
        localStorage.removeItem('dte-custom-api-key');
        document.getElementById('api-key-status').textContent = "Rotating Mode";
        document.getElementById('api-key-status').style.color = "var(--success)";
        window.showToast("Returned to rotating mode", "info");
      }
    }
  });

  if (customApiKey) {
    document.getElementById('api-key-status').textContent = "Custom Key Active";
    document.getElementById('api-key-status').style.color = "var(--accent)";
  }

  // Step timeline clicks
  const steps = [2, 3, 3.5, 4, 4.5, 5, 6, 7];
  steps.forEach(s => {
    const el = document.getElementById(`step-n-${s}`);
    if (el) {
      el.addEventListener('click', () => {
        if (genState.stepStatus[s] === 'locked') {
          window.showToast(`Layer ${s} is locked. Generate previous layers first.`, 'warning');
          return;
        }
        window.setActiveStep(s);
      });
    }
  });

  const stepMeta = {
    2: { title: "Layer 2 — Contracts", desc: "Derive logical constraints and downstream obligations for each node from the topology structure.", btn: "Generate Contracts" },
    3: { title: "Layer 3 — Premise Seed", desc: "Generate a short unconstrained creative seed for setting, victim, scenario, and suspects.", btn: "Generate Premise" },
    3.5: { title: "Layer 3.5 — Truth Ledger", desc: "Construct the objective reality of the mystery world (suspect profiles, assets, relationship truths, unique intersection).", btn: "Generate Truth Ledger" },
    4: { title: "Layer 4 — Knowledge Ledger", desc: "Track who knows each truth from the Truth Ledger, when, and how, highlighting secrets.", btn: "Generate Knowledge Ledger" },
    4.5: { title: "Layer 4.5 — Evidence Ledger", desc: "Derive observable traces (clues, footprint, logs) caused by character actions.", btn: "Generate Evidence Ledger" },
    5: { title: "Layer 5 — Allocation Ledger", desc: "Map evidence/truths to specific topology nodes in discovery order.", btn: "Generate Allocations" },
    6: { title: "Layer 6 — Node Prose", desc: "Sequentially write narrative prose blocks for all nodes in topological dependency order.", btn: "Generate Story Prose" },
    7: { title: "Layer 7 — Consistency Verification", desc: "Run a backward sweep checking topology, knowledge, and clue consistency.", btn: "Run Verification" }
  };

  window.setActiveStep = function(step) {
    genState.currentStep = step;
    
    steps.forEach(s => {
      const el = document.getElementById(`step-n-${s}`);
      if (el) {
        el.className = 'step-node';
        if (genState.stepStatus[s] === 'complete') {
          el.classList.add('complete');
        } else if (genState.stepStatus[s] === 'generating') {
          el.classList.add('generating');
        } else if (genState.stepStatus[s] === 'locked') {
          el.style.opacity = '0.5';
        }
      }
    });

    const activeNode = document.getElementById(`step-n-${step}`);
    if (activeNode) {
      activeNode.classList.remove('complete');
      activeNode.classList.add('active');
      activeNode.style.opacity = '1';
    }

    document.getElementById('active-step-title').textContent = stepMeta[step].title;
    document.getElementById('active-step-desc').textContent = stepMeta[step].desc;
    
    const genBtn = document.getElementById('btn-generate-layer');
    genBtn.textContent = `${stepMeta[step].btn} (Layer ${step})`;
    genBtn.disabled = genState.stepStatus[step] === 'generating';

    document.getElementById('output-title').textContent = `Layer ${step} Output`;
    renderWorkspaceContent();
  }

  // Work Area Renders
  function renderLayer2() {
    const data = genState.stepData[2];
    if (!data || !data.nodes) return `<div class="empty">No contract data.</div>`;
    
    let html = '<div style="display:flex; flex-direction:column; gap:6px;">';
    for (const [nodeId, contract] of Object.entries(data.nodes)) {
      const node = window.state.nodes.find(n => n.id === nodeId);
      const label = node ? node.label : nodeId;
      const type = node ? node.type : 'unknown';
      
      html += `
        <div class="contract-card" onclick="window.focusNode('${nodeId}')">
          <div class="contract-header">
            <span class="contract-node-name">${label} (${nodeId})</span>
            <span class="contract-node-type">${type}</span>
          </div>
          <div class="contract-detail"><strong>Receives:</strong> ${contract.receives.join(', ')}</div>
          <div class="contract-detail"><strong>Produces:</strong> ${contract.produces.join(', ')}</div>
          <div class="contract-detail"><strong>Forbidden:</strong> ${contract.forbidden_to_reveal.join(', ')}</div>
          ${contract.delegated_guarantees && contract.delegated_guarantees.length ? `<div class="contract-detail"><strong>Delegated:</strong> ${contract.delegated_guarantees.join(', ')}</div>` : ''}
        </div>
      `;
    }
    html += '</div>';
    return html;
  }

  function renderLayer3() {
    const data = genState.stepData[3];
    if (!data || !data.premise) return `<div class="empty">No premise data.</div>`;
    return `
      <div style="font-family:'Inter', sans-serif; font-size:11.5px; line-height:1.6; color:var(--text-primary); padding:10px; background:rgba(255,255,255,0.02); border-radius:var(--radius-sm); border-left:2px solid var(--accent-2);">
        ${data.premise}
      </div>
    `;
  }

  function renderLayer3_5() {
    const data = genState.stepData[3.5];
    if (!data) return `<div class="empty">No truth ledger data.</div>`;
    
    const bible = data.world_bible || {};
    const suspects = bible.suspects || [];
    const proofs = data.topology_proofs || {};
    
    let html = '<div style="display:flex; flex-direction:column; gap:10px;">';
    
    html += '<div><span style="font-size:9px; color:var(--accent); font-weight:800; text-transform:uppercase;">Suspect Profiles</span>';
    suspects.forEach(s => {
      let tags = [];
      if (s.true_killer) tags.push('<span style="color:var(--error); font-weight:bold;">[KILLER]</span>');
      if (s.false_resolution_candidate) tags.push('<span style="color:var(--warning);">[FALSE RESOLUTION]</span>');
      if (s.herring_candidate) tags.push('<span style="color:var(--accent-2);">[RED HERRING]</span>');
      
      html += `
        <div style="padding:6px; background:rgba(0,0,0,0.2); border:1px solid rgba(255,255,255,0.04); margin-top:4px; border-radius:var(--radius-sm);">
          <div style="font-weight:700; color:var(--text-primary);">${s.name} (${s.role}) ${tags.join(' ')}</div>
          <div style="font-size:9.5px; color:var(--text-secondary);">Relationship: ${s.relationship}</div>
        </div>
      `;
    });
    html += '</div>';

    if (proofs.GG1) {
      const gg = proofs.GG1;
      html += `
        <div style="border:1px solid var(--border-light); padding:8px; border-radius:var(--radius-sm); background:rgba(0, 240, 255, 0.02);">
          <span style="font-size:9px; color:var(--accent); font-weight:800; text-transform:uppercase; display:block; margin-bottom:4px;">Intersection Logic (GG1)</span>
          <div style="font-size:10px; color:var(--text-primary);">P_financial: [${(gg.P_financial || []).join(', ')}]</div>
          <div style="font-size:10px; color:var(--text-primary);">P_digital: [${(gg.P_digital || []).join(', ')}]</div>
          <div style="font-size:10px; font-weight:bold; color:var(--success); margin-top:4px;">Intersection (Guilt Set) = {${(gg.intersection || []).join(', ')}} (Cardinality: ${gg.cardinality || 0})</div>
        </div>
      `;
    }
    
    html += '</div>';
    return html;
  }

  function renderLayer4() {
    const data = genState.stepData[4];
    if (!data || !data.actors) return `<div class="empty">No knowledge timeline data.</div>`;
    
    let html = '<div class="timeline-grid">';
    for (const [actorName, info] of Object.entries(data.actors)) {
      html += `
        <div class="timeline-actor-row">
          <div class="timeline-actor-name">${actorName}</div>
      `;
      
      const timeline = info.timeline || [];
      timeline.forEach(evt => {
        html += `
          <div class="timeline-event">
            <span class="timeline-event-time">${evt.stage} ${evt.suppressed ? '<span style="color:var(--error); font-size:7px;">[SUPPRESSED]</span>' : ''}</span>
            <div class="timeline-event-desc">${evt.known_truths.join(', ')}</div>
            <div style="font-size:8px; color:var(--text-muted);">Source: ${evt.source}</div>
          </div>
        `;
      });
      
      html += '</div>';
    }
    html += '</div>';
    return html;
  }

  function renderLayer4_5() {
    const data = genState.stepData[4.5];
    if (!data || !data.evidence_traces) return `<div class="empty">No evidence trace data.</div>`;
    
    let html = '<div style="display:flex; flex-direction:column; gap:6px;">';
    for (const [id, trace] of Object.entries(data.evidence_traces)) {
      html += `
        <div class="trace-card">
          <div class="trace-header">
            <span>${id}: ${trace.name}</span>
            <span>Loc: ${trace.location}</span>
          </div>
          <div style="font-size:10px; color:var(--text-primary);">${trace.description}</div>
          <div class="trace-cause">Cause: ${trace.causal_knowledge_ref}</div>
          ${trace.associated_entities && trace.associated_entities.length ? `<div style="font-size:8px; color:var(--text-muted); margin-top:2px;">Entities: ${trace.associated_entities.join(', ')}</div>` : ''}
        </div>
      `;
    }
    html += '</div>';
    return html;
  }

  function renderLayer5() {
    const data = genState.stepData[5];
    if (!data || !data.facts) return `<div class="empty">No fact allocation data.</div>`;
    
    let html = '<div style="display:flex; flex-direction:column; gap:6px;">';
    const allocations = data.node_allocations || {};
    for (const [nodeId, factIds] of Object.entries(allocations)) {
      const node = window.state.nodes.find(n => n.id === nodeId);
      const label = node ? node.label : nodeId;
      
      html += `
        <div class="contract-card" onclick="window.focusNode('${nodeId}')">
          <div style="font-weight:700; color:var(--accent); font-size:10px; margin-bottom:4px;">Node: ${label} (${nodeId})</div>
      `;
      
      factIds.forEach(fid => {
        const fact = data.facts[fid];
        if (fact) {
          html += `
            <div style="padding:4px; background:rgba(255,255,255,0.02); border-left:2px solid var(--cyber-yellow); margin-top:3px; font-size:9.5px;">
              <strong>${fid} (${fact.visibility}):</strong> ${fact.statement}
            </div>
          `;
        }
      });
      
      html += '</div>';
    }
    html += '</div>';
    return html;
  }

  window.focusNodeAndSelectProse = function(nodeId) {
    window.focusNode(nodeId);
    document.querySelectorAll('.story-node-prose').forEach(el => el.classList.remove('selected'));
    const card = document.getElementById(`prose-card-${nodeId}`);
    if (card) card.classList.add('selected');
  };

  function renderLayer6() {
    const data = genState.stepData[6];
    if (!data || Object.keys(data).length === 0) return `<div class="empty">No story prose generated yet. Click generate to write the story sequentially.</div>`;
    
    let html = '<div class="story-prose-container">';
    const sortedNodeIds = getTopologicalOrder();
    
    sortedNodeIds.forEach(nodeId => {
      const prose = data[nodeId];
      if (prose) {
        const node = window.state.nodes.find(n => n.id === nodeId);
        const label = node ? node.label : nodeId;
        
        html += `
          <div class="story-node-prose" id="prose-card-${nodeId}" onclick="window.focusNodeAndSelectProse('${nodeId}')">
            <div class="story-node-label">${label} (${nodeId})</div>
            <div class="story-node-text">${prose}</div>
            <div style="display:flex; justify-content:flex-end; margin-top:4px;">
              <button class="btn" onclick="event.stopPropagation(); window.regenerateNodeProse('${nodeId}')" style="font-size:7px; padding:1px 4px; height:16px;">Regen</button>
            </div>
          </div>
        `;
      }
    });
    
    html += '</div>';
    return html;
  }

  function renderLayer7() {
    const data = genState.stepData[7];
    if (!data) return `<div class="empty">No verification report data.</div>`;
    
    let html = '<div style="display:flex; flex-direction:column; gap:8px;">';
    const statusText = data.pass ? 'PASS' : 'FAIL';
    const statusColor = data.pass ? 'var(--success)' : 'var(--error)';
    
    html += `
      <div style="text-align:center; padding:12px; border:1px solid ${statusColor}; background:rgba(${data.pass ? '0,255,204' : '255,0,85'}, 0.05); border-radius:var(--radius-sm);">
        <span style="font-size:14px; font-weight:800; color:${statusColor};">Story Verification: ${statusText}</span>
      </div>
    `;
    
    const checks = data.checks || [];
    checks.forEach(c => {
      const isPass = c.status === 'PASS';
      html += `
        <div class="verify-row">
          <div class="verify-status ${isPass ? 'pass' : 'fail'}">${isPass ? '✓' : '✗'}</div>
          <div>
            <div class="verify-name">${c.name}</div>
            <div class="verify-desc">${c.comments}</div>
            ${c.failure_origin_layer ? `<div style="font-size:8.5px; color:var(--error); font-weight:bold; margin-top:2px;">Origin: Layer ${c.failure_origin_layer}</div>` : ''}
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    return html;
  }

  function renderWorkspaceContent() {
    const body = document.getElementById('output-view-body');
    if (!body) return;

    const step = genState.currentStep;
    const data = genState.stepData[step];

    if (step === 6) {
      const keys = Object.keys(data || {});
      if (keys.length === 0) {
        body.innerHTML = `<div class="empty" style="font-style:italic; text-align:center; padding:30px 0; font-size:10px; color:var(--text-muted);">No story prose generated yet. Click generate to write the story sequentially.</div>`;
        return;
      }
      body.innerHTML = renderLayer6();
      return;
    }

    if (!data) {
      body.innerHTML = `<div class="empty" style="font-style:italic; text-align:center; padding:30px 0; font-size:10px; color:var(--text-muted);">No data generated yet. Click generate to begin.</div>`;
      return;
    }

    if (step === 2) body.innerHTML = renderLayer2();
    else if (step === 3) body.innerHTML = renderLayer3();
    else if (step === 3.5) body.innerHTML = renderLayer3_5();
    else if (step === 4) body.innerHTML = renderLayer4();
    else if (step === 4.5) body.innerHTML = renderLayer4_5();
    else if (step === 5) body.innerHTML = renderLayer5();
    else if (step === 7) body.innerHTML = renderLayer7();
  }

  // Layer 6 Sequential Prose Writer
  async function generateLayer6() {
    const sortedNodes = getTopologicalOrder();
    if (sortedNodes.length === 0) {
      throw new Error("No nodes found in topology.");
    }
    
    appendTerminal(`Starting sequential prose generation for ${sortedNodes.length} nodes...`, 'info');
    genState.stepData[6] = {};
    
    for (let i = 0; i < sortedNodes.length; i++) {
      const nodeId = sortedNodes[i];
      const node = window.state.nodes.find(n => n.id === nodeId);
      const label = node ? node.label : nodeId;
      const type = node ? node.type : 'unknown';
      
      appendTerminal(`Writing prose block for Node ${label} (${nodeId}) [${i+1}/${sortedNodes.length}]...`, 'info');
      window.focusNode(nodeId);
      
      const contracts = genState.stepData[2] || { nodes: {} };
      const contract = (contracts.nodes && contracts.nodes[nodeId]) ? contracts.nodes[nodeId] : {};
      
      const allocations = genState.stepData[5] || { facts: {}, node_allocations: {} };
      const factIds = (allocations.node_allocations && allocations.node_allocations[nodeId]) ? allocations.node_allocations[nodeId] : [];
      const allocatedFacts = factIds.map(fid => allocations.facts[fid]).filter(Boolean);
      
      let upstreamProse = "";
      for (let j = 0; j < i; j++) {
        const upId = sortedNodes[j];
        if (genState.stepData[6][upId]) {
          const upNode = window.state.nodes.find(n => n.id === upId);
          upstreamProse += `Node ${upNode ? upNode.label : upId} Prose:\n${genState.stepData[6][upId]}\n\n`;
        }
      }
      
      const genre = document.getElementById('gen-genre').value;
      const tone = document.getElementById('gen-tone').value;
      const setting = document.getElementById('gen-setting').value;
      const worldBible = genState.stepData[3.5] ? genState.stepData[3.5].world_bible : {};
      
      const body = {
        nodeId, nodeLabel: label, nodeType: type,
        contract, worldBible, allocatedFacts, upstreamProse,
        genre, tone, setting
      };
      
      try {
        const res = await callBackendAPI('/api/generate/prose', body);
        if (res && res.prose) {
          genState.stepData[6][nodeId] = res.prose;
          renderWorkspaceContent();
        } else {
          throw new Error("No prose returned in response JSON.");
        }
      } catch (err) {
        appendTerminal(`Error on Node ${label}: ${err.message}`, 'err');
        throw err;
      }
    }
    
    appendTerminal(`Sequential prose generation complete!`, 'success');
  }

  window.regenerateNodeProse = async function(nodeId) {
    const node = window.state.nodes.find(n => n.id === nodeId);
    if (!node) return;
    const label = node.label;
    const type = node.type;
    
    appendTerminal(`Regenerating prose block for Node ${label} (${nodeId})...`, 'info');
    
    const sortedNodes = getTopologicalOrder();
    const index = sortedNodes.indexOf(nodeId);
    
    const contracts = genState.stepData[2] || { nodes: {} };
    const contract = (contracts.nodes && contracts.nodes[nodeId]) ? contracts.nodes[nodeId] : {};
    
    const allocations = genState.stepData[5] || { facts: {}, node_allocations: {} };
    const factIds = (allocations.node_allocations && allocations.node_allocations[nodeId]) ? allocations.node_allocations[nodeId] : [];
    const allocatedFacts = factIds.map(fid => allocations.facts[fid]).filter(Boolean);
    
    let upstreamProse = "";
    for (let j = 0; j < index; j++) {
      const upId = sortedNodes[j];
      if (genState.stepData[6][upId]) {
        const upNode = window.state.nodes.find(n => n.id === upId);
        upstreamProse += `Node ${upNode ? upNode.label : upId} Prose:\n${genState.stepData[6][upId]}\n\n`;
      }
    }
    
    const genre = document.getElementById('gen-genre').value;
    const tone = document.getElementById('gen-tone').value;
    const setting = document.getElementById('gen-setting').value;
    const worldBible = genState.stepData[3.5] ? genState.stepData[3.5].world_bible : {};
    
    const body = {
      nodeId, nodeLabel: label, nodeType: type,
      contract, worldBible, allocatedFacts, upstreamProse,
      genre, tone, setting
    };
    
    try {
      const res = await callBackendAPI('/api/generate/prose', body);
      if (res && res.prose) {
        genState.stepData[6][nodeId] = res.prose;
        renderWorkspaceContent();
        window.showToast(`Node ${label} regenerated successfully!`, 'success');
      }
    } catch (err) {
      appendTerminal(`Error regenerating Node ${label}: ${err.message}`, 'err');
      window.showToast(`Regeneration failed: ${err.message}`, 'error');
    }
  };

  // Redraw SVG (shows allocation badges)
  function overlayAllocatedFactsOnCanvas() {
    window.render();
  }

  // Edit JSON Raw modal
  const btnEditRaw = document.getElementById('btn-edit-layer-raw');
  btnEditRaw.addEventListener('click', () => {
    const step = genState.currentStep;
    const data = genState.stepData[step];
    if (!data) {
      window.showToast("No data to edit yet.", "warning");
      return;
    }
    
    const host = document.getElementById('modal-host');
    host.innerHTML = '';
    
    const back = document.createElement('div');
    back.className = 'modal-backdrop';
    
    const m = document.createElement('div');
    m.className = 'modal';
    
    const jsonString = JSON.stringify(data, null, 2);
    
    m.innerHTML = `
      <h3>Edit Layer ${step} Data</h3>
      <p>Modify the generated structures directly. Ensure JSON remains valid.</p>
      <textarea id="edit-raw-textarea" style="width:100%; min-height:280px; font-family:'Fira Code', monospace; font-size:10px;"></textarea>
      <div class="row">
        <button id="edit-raw-cancel">Cancel</button>
        <button id="edit-raw-save" class="primary">Save Changes</button>
      </div>
    `;
    
    back.appendChild(m);
    host.appendChild(back);
    
    document.getElementById('edit-raw-textarea').value = jsonString;
    
    document.getElementById('edit-raw-cancel').addEventListener('click', () => { host.innerHTML = ''; });
    document.getElementById('edit-raw-save').addEventListener('click', () => {
      const txt = document.getElementById('edit-raw-textarea').value;
      try {
        const parsed = JSON.parse(txt);
        genState.stepData[step] = parsed;
        host.innerHTML = '';
        renderWorkspaceContent();
        if (step === 5) overlayAllocatedFactsOnCanvas();
        window.showToast(`Layer ${step} manual edits saved!`, 'success');
      } catch (err) {
        alert("Invalid JSON format: " + err.message);
      }
    });
  });

  // Generate Button Handler
  const btnGenerate = document.getElementById('btn-generate-layer');
  btnGenerate.addEventListener('click', async () => {
    const step = genState.currentStep;
    
    if (window.state.nodes.length === 0) {
      window.showToast("Draw or load a topology graph first!", "error");
      appendTerminal("Generation aborted: empty topology graph.", "err");
      return;
    }

    genState.stepStatus[step] = 'generating';
    window.setActiveStep(step);
    
    try {
      if (step === 2) {
        const graph = getGraphForLLM();
        appendTerminal("Deriving logical node contracts from topology...", "info");
        const res = await callBackendAPI('/api/generate/contracts', { graph });
        
        genState.stepData[2] = res;
        genState.stepStatus[2] = 'complete';
        genState.stepStatus[3] = 'ready';
        appendTerminal("Layer 2 contracts complete.", "success");
        setTimeout(() => window.setActiveStep(3), 100);
      } 
      else if (step === 3) {
        const genre = document.getElementById('gen-genre').value;
        const tone = document.getElementById('gen-tone').value;
        const setting = document.getElementById('gen-setting').value;
        const contracts = genState.stepData[2];
        
        appendTerminal(`Writing creative premise seed...`, "info");
        const res = await callBackendAPI('/api/generate/premise', { genre, tone, contracts, setting });
        
        genState.stepData[3] = res;
        genState.stepStatus[3] = 'complete';
        genState.stepStatus[3.5] = 'ready';
        appendTerminal("Layer 3 premise seed established.", "success");
        setTimeout(() => window.setActiveStep(3.5), 100);
      } 
      else if (step === 3.5) {
        const graph = getGraphForLLM();
        const premise = genState.stepData[3].premise;
        const contracts = genState.stepData[2];
        const setting = document.getElementById('gen-setting').value;
        
        appendTerminal("Compiling Truth Ledger world bible...", "info");
        const res = await callBackendAPI('/api/generate/truth-ledger', { graph, premise, contracts, setting });
        
        genState.stepData[3.5] = res;
        genState.stepStatus[3.5] = 'complete';
        genState.stepStatus[4] = 'ready';
        appendTerminal("Layer 3.5 Truth Ledger compiled.", "success");
        setTimeout(() => window.setActiveStep(4), 100);
      } 
      else if (step === 4) {
        const truthLedger = genState.stepData[3.5];
        
        appendTerminal("Deriving actor timelines...", "info");
        const res = await callBackendAPI('/api/generate/knowledge-ledger', { truthLedger });
        
        genState.stepData[4] = res;
        genState.stepStatus[4] = 'complete';
        genState.stepStatus[4.5] = 'ready';
        appendTerminal("Layer 4 Knowledge Ledger derived.", "success");
        setTimeout(() => window.setActiveStep(4.5), 100);
      } 
      else if (step === 4.5) {
        const truthLedger = genState.stepData[3.5];
        const knowledgeLedger = genState.stepData[4];
        
        appendTerminal("Cataloging evidence traces...", "info");
        const res = await callBackendAPI('/api/generate/evidence-ledger', { truthLedger, knowledgeLedger });
        
        genState.stepData[4.5] = res;
        genState.stepStatus[4.5] = 'complete';
        genState.stepStatus[5] = 'ready';
        appendTerminal("Layer 4.5 Evidence Ledger derived.", "success");
        setTimeout(() => window.setActiveStep(5), 100);
      } 
      else if (step === 5) {
        const graph = getGraphForLLM();
        const truthLedger = genState.stepData[3.5];
        const evidenceLedger = genState.stepData[4.5];
        
        appendTerminal("Allocating facts to topology...", "info");
        const res = await callBackendAPI('/api/generate/allocation-ledger', { graph, truthLedger, evidenceLedger });
        
        genState.stepData[5] = res;
        genState.stepStatus[5] = 'complete';
        genState.stepStatus[6] = 'ready';
        appendTerminal("Layer 5 allocations complete.", "success");
        
        overlayAllocatedFactsOnCanvas();
        
        setTimeout(() => window.setActiveStep(6), 100);
      } 
      else if (step === 6) {
        await generateLayer6();
        
        genState.stepStatus[6] = 'complete';
        genState.stepStatus[7] = 'ready';
        setTimeout(() => window.setActiveStep(7), 100);
      } 
      else if (step === 7) {
        const storyProse = genState.stepData[6];
        const contracts = genState.stepData[2];
        const worldBible = genState.stepData[3.5] ? genState.stepData[3.5].world_bible : {};
        const knowledgeLedger = genState.stepData[4];
        const allocationLedger = genState.stepData[5];
        
        appendTerminal("Auditing prose consistency sweep...", "info");
        const res = await callBackendAPI('/api/generate/verify', { storyProse, contracts, worldBible, knowledgeLedger, allocationLedger });
        
        genState.stepData[7] = res;
        genState.stepStatus[7] = 'complete';
        
        if (res.pass) {
          appendTerminal("Verification PASS! Logical checks cleared.", "success");
          window.showToast("Story verified successfully!", "success");
        } else {
          appendTerminal("Verification FAIL. Logic anomalies detected.", "err");
          window.showToast("Verification failed. Check report.", "error");
        }
        
        window.setActiveStep(7);
      }
    } catch (err) {
      appendTerminal(`Generation failed: ${err.message}`, "err");
      window.showToast(`Generation failed: ${err.message}`, "error");
      genState.stepStatus[step] = 'ready';
      window.setActiveStep(step);
    }
  });

  // Integration with Backend Project Manager (Load / Save Overrides)

  // Load project modal
  function openLoadModal() {
    const host = document.getElementById('modal-host');
    host.innerHTML = '';
    const back = document.createElement('div');
    back.className = 'modal-backdrop';
    const m = document.createElement('div');
    m.className = 'modal';
    
    m.innerHTML = `
      <h3>Load Project</h3>
      <p>Choose a project stored in the backend or load a local file.</p>
      <div id="project-db-list" style="max-height: 200px; overflow-y: auto; margin-bottom: 12px; border: 1px solid var(--border-light); padding: 8px; border-radius: var(--radius-sm);">
        <div style="font-size: 10px; color: var(--text-muted); font-style: italic; text-align: center; padding: 12px 0;">Querying server database...</div>
      </div>
      <textarea id="m-text" placeholder="Or paste raw JSON here…" style="display: none;"></textarea>
      <div class="row">
        <input type="file" id="m-file" accept=".json,application/json" style="display:none">
        <button id="m-toggle-json" style="font-size: 8px;">Paste Raw JSON</button>
        <button id="m-pick">Choose Local File…</button>
        <button id="m-cancel">Cancel</button>
        <button id="m-ok" class="primary" style="display: none;">Load pasted JSON</button>
      </div>
    `;
    back.appendChild(m); host.appendChild(back);
    
    const fileInput = document.getElementById('m-file');
    document.getElementById('m-pick').addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', e => {
      const f = e.target.files[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = evt => {
        try {
          window.restore(evt.target.result);
          host.innerHTML = '';
          window.showToast(`Loaded ${f.name} successfully`, 'success');
        } catch (err) { alert('Invalid project JSON: ' + err.message); }
      };
      reader.readAsText(f);
    });

    const textInput = document.getElementById('m-text');
    const okBtn = document.getElementById('m-ok');
    document.getElementById('m-toggle-json').addEventListener('click', () => {
      textInput.style.display = 'block';
      okBtn.style.display = 'inline-block';
      document.getElementById('project-db-list').style.display = 'none';
      document.getElementById('m-toggle-json').style.display = 'none';
    });

    okBtn.addEventListener('click', () => {
      try {
        window.restore(textInput.value);
        host.innerHTML = '';
        window.showToast('Loaded local project data', 'success');
      } catch (err) { alert('Invalid JSON: ' + err.message); }
    });

    document.getElementById('m-cancel').addEventListener('click', () => { host.innerHTML = ''; });
    back.addEventListener('click', e => { if (e.target === back) host.innerHTML = ''; });

    // Load from server
    fetch('/api/projects')
      .then(res => res.json())
      .then(projects => {
        const listDiv = document.getElementById('project-db-list');
        if (projects.length === 0) {
          listDiv.innerHTML = `<div style="font-size: 10px; color: var(--text-muted); font-style: italic; text-align: center; padding: 12px 0;">No projects stored in backend yet.</div>`;
          return;
        }
        listDiv.innerHTML = '';
        projects.forEach(p => {
          const dateStr = new Date(p.updatedAt).toLocaleString();
          const row = document.createElement('div');
          row.className = 'proj-select-row';
          row.innerHTML = `
            <span class="proj-select-name">${p.name}</span>
            <span class="proj-select-date">${dateStr}</span>
            <button class="proj-select-del">×</button>
          `;
          
          row.querySelector('.proj-select-name').addEventListener('click', () => {
            fetch(`/api/projects/${p.name}`)
              .then(res => res.json())
              .then(data => {
                window.restore(JSON.stringify(data));
                host.innerHTML = '';
                window.showToast(`Restored server project "${p.name}"`, 'success');
              })
              .catch(err => {
                alert(`Error loading project: ${err.message}`);
              });
          });

          row.querySelector('.proj-select-del').addEventListener('click', (ev) => {
            ev.stopPropagation();
            if (confirm(`Delete project "${p.name}" from server?`)) {
              fetch(`/api/projects/${p.name}`, { method: 'DELETE' })
                .then(res => res.json())
                .then(() => {
                  row.remove();
                  window.showToast(`Deleted project "${p.name}"`, 'warning');
                  if (listDiv.children.length === 0) {
                    listDiv.innerHTML = `<div style="font-size: 10px; color: var(--text-muted); font-style: italic; text-align: center; padding: 12px 0;">No projects stored in backend.</div>`;
                  }
                });
            }
          });
          
          listDiv.appendChild(row);
        });
      })
      .catch(err => {
        const listDiv = document.getElementById('project-db-list');
        listDiv.innerHTML = `<div style="font-size: 10px; color: var(--error); text-align: center; padding: 12px 0;">Failed to query server: ${err.message}</div>`;
      });
  }

  // Override topbar Load button
  const btnLoad = document.getElementById('btn-load');
  if (btnLoad) {
    // Clone and replace to strip existing listeners
    const newBtn = btnLoad.cloneNode(true);
    btnLoad.parentNode.replaceChild(newBtn, btnLoad);
    newBtn.addEventListener('click', openLoadModal);
  }

  // Override topbar Save button
  const btnSave = document.getElementById('btn-save');
  if (btnSave) {
    const newBtn = btnSave.cloneNode(true);
    btnSave.parentNode.replaceChild(newBtn, btnSave);
    newBtn.addEventListener('click', () => {
      const projName = window.state.name || 'Untitled project';
      const nameInput = prompt("Enter project name to save in server database:", projName);
      if (nameInput === null) return;
      const finalName = nameInput.trim() || 'Untitled project';
      
      const payload = JSON.parse(window.snapshot());
      
      fetch(`/api/projects/${finalName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
      .then(res => res.json())
      .then(() => {
        window.state.name = finalName;
        document.getElementById('proj-name').value = finalName;
        window.showToast(`Project "${finalName}" saved to server`, 'success');
        // Also save a local autosave copy
        localStorage.setItem('dte-autosave', window.snapshot());
      })
      .catch(err => {
        alert(`Error saving project: ${err.message}`);
      });
    });
  }

  // Initialize setActiveStep
  if (genState.currentStep) {
    window.setActiveStep(genState.currentStep);
  } else {
    window.setActiveStep(2);
  }

})();
