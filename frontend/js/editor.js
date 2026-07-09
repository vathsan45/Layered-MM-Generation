(function() {
  'use strict';

  const NODE_TYPES = [
    { group: 'Structural', items: [
      { id: 'entry',    label: 'Entry',         accent: '#e1e1e6', stroke: '#e1e1e6', fill: 'rgba(225,225,230,0.06)', desc: 'Top of the spine. The thing that starts the deduction.',
        icon: 'M15 7h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3 M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2M9 14l2 2 4-4' },
      { id: 'terminus', label: 'Terminus',      accent: '#ff0055', stroke: '#ff3370', fill: 'rgba(255,0,85,0.08)', desc: 'Bottom of the spine. The resolution point.',
        icon: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm0-15v10m-3-3l3 3 3-3' },
      { id: 'spine',    label: 'Spine',         accent: '#8b80ff', stroke: '#c0b8ff', fill: 'rgba(139,128,255,0.08)', desc: 'Intermediate node on the main deduction chain.',
        icon: 'M12 2v20 M7 5h10 M7 19h10 M7 12h10' },
      { id: 'branch',   label: 'Branch',        accent: '#00f0ff', stroke: '#66f7ff', fill: 'rgba(0,240,255,0.06)',  desc: 'Intermediate node belonging to a parallel sub-DAG.',
        icon: 'M18 8h-4a4 4 0 0 0-4 4v2a4 4 0 0 1-4 4H2' },
      { id: 'state',    label: 'State change',  accent: '#ffe600', stroke: '#ffea54', fill: 'rgba(255,230,0,0.06)', desc: 'Flips downstream meanings. A reveal that recontextualises what came before.',
        icon: 'M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1.03 6.67 2.83M21 3v6h-6' }
    ]},
    { group: 'Logic gates', items: [
      { id: 'and',        label: 'Convergence',  accent: '#00bfff', stroke: '#70e0ff', fill: 'rgba(0,191,255,0.06)', desc: 'AND gate. Fires only when all inputs fire.',
        icon: 'M6 4h5a7 7 0 0 1 0 14H6V4z M6 9h12' },
      { id: 'or',         label: 'Disjunction',  accent: '#5dcdff', stroke: '#a3e5ff', fill: 'rgba(93,205,255,0.06)', desc: 'OR gate. Fires when any input fires.',
        icon: 'M4 4c4 4 4 10 0 14h5a10 10 0 0 0 9-7 10 10 0 0 0-9-7H4z' },
      { id: 'constraint', label: 'Constraint',   accent: '#ff007f', stroke: '#ff5ea7', fill: 'rgba(255,0,127,0.06)',desc: 'Eliminates candidates from a set. Arity = candidate count.',
        icon: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M12 6v12 M6 12h12' },
      { id: 'elim',       label: 'Elimination',  accent: '#ff0055', stroke: '#ff5c8a', fill: 'rgba(255,0,85,0.06)', desc: 'Applies a rule to reduce a candidate set toward one.',
        icon: 'M18 6L6 18M6 6l12 12' }
    ]},
    { group: 'Gating and decoys', items: [
      { id: 'puzzle',    label: 'Puzzle gate',       accent: '#ff007f', stroke: '#ff5ea7', fill: 'rgba(255,0,127,0.06)', desc: 'Mechanical obstacle. Output selects which downstream branch is canonical.',
        icon: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M2 12h6M16 12h6' },
      { id: 'commit',    label: 'Commitment',        accent: '#8b80ff', stroke: '#b3aeff', fill: 'rgba(139,128,255,0.06)',  desc: 'Declares a rule the deduction must satisfy. Forbids stopping at the obvious answer.',
        icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
      { id: 'decoy',     label: 'Decoy',             accent: '#8b8b95', stroke: '#c2c2ca', fill: 'rgba(139,139,149,0.06)', desc: 'Member of a donut-hole stream.',
        icon: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm0-18a8 8 0 1 0 0 16 8 8 0 0 0 0-16z' },
      { id: 'false-res', label: 'False resolution',  accent: '#ff9d5c', stroke: '#ffd1b3', fill: 'rgba(255,157,92,0.06)',  desc: 'Apparent endpoint of a decoy stream. Must have a recontextualisation or elimination edge out.',
        icon: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01' },
      { id: 'herring',   label: 'Red herring',       accent: '#ff0055', stroke: '#ff5c8a', fill: 'rgba(255,0,85,0.06)', desc: 'Points at the wrong target. Must resolve cleanly via a later edge.',
        icon: 'M12 2L2 22h20L12 2zm0 13a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm1-4h-2V7h2v4z' }
    ]},
    { group: 'Abstract', items: [
      { id: 'anchor',      label: 'Anchor',       accent: '#00ffcc', stroke: '#5cffd6', fill: 'rgba(0,255,204,0.06)',  desc: 'Abstract slot a branch represents. Plot-free placeholder.',
        icon: 'M5 12h14 M12 5v14 M12 5l-4 4 M12 19l4-4' },
      { id: 'observation', label: 'Observation',  accent: '#7ee0c0', stroke: '#c0f7e4', fill: 'rgba(126,224,192,0.06)', desc: 'Generic clue node. Becomes legible once prerequisites fire.',
        icon: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zm11 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6z' }
    ]}
  ];

  const EDGE_TYPES = [
    { id: 'prereq',    label: 'Prerequisite',         color: '#a1a1a8', marker: 'arr-prereq',    dash: '',         explain: 'A must fire before B is legible.' },
    { id: 'and-in',    label: 'Convergence input',    color: '#3da5ff', marker: 'arr-andin',     dash: '',         explain: 'A is one of several inputs feeding an AND gate.' },
    { id: 'or-in',     label: 'Disjunctive input',    color: '#5dcdff', marker: 'arr-orin',      dash: '',         explain: 'A is one of several inputs feeding an OR gate.' },
    { id: 'elim',      label: 'Elimination',          color: '#ff007f', marker: 'arr-elim',      dash: '5 4',      explain: 'A removes a candidate from B set.' },
    { id: 'contra',    label: 'Contradiction',        color: '#ff4a70', marker: 'arr-contra',    dash: '2 4',      explain: 'A and B cannot both be true.' },
    { id: 'recontext', label: 'Recontextualisation',  color: '#ff9d5c', marker: 'arr-recontext', dash: '7 4',      explain: 'A re-reads B with a new frame. Backward edge.' },
    { id: 'decoy',     label: 'Decoy support',        color: '#8b8b95', marker: 'arr-decoy',     dash: '3 4',      explain: 'A appears to support B but actually supports elsewhere.' },
    { id: 'time',      label: 'Time gate',            color: '#00ffcc', marker: 'arr-time',      dash: '8 3 2 3',  explain: 'A activates only after a state change fires.' }
  ];

  const STREAM_TYPES = ['spine', 'branch', 'donut-hole', 'recontext-loop', 'convergence-hub', 'elimination-filter', 'misdirection'];
  const STREAM_COLORS = ['#8b80ff', '#00ffcc', '#ff9d5c', '#ff007f', '#3da5ff', '#ffe600', '#5dcdff'];

  const NS = 'http://www.w3.org/2000/svg';

  const state = {
    name: 'Untitled topology',
    nodes: [], edges: [], streams: [],
    nodeIdCounter: 1, edgeIdCounter: 1, streamIdCounter: 1,
    selectedNode: null, selectedEdge: null,
    mode: 'select', connectFrom: null, drag: null,
    dials: { gate: 'puzzle', decoy: 'single', recontext: 'none', res: 'coupled' },
    snapToGrid: false
  };

  const history = { stack: [], pointer: -1, max: 60 };

  const svg = document.getElementById('svg');
  const gEdges = document.getElementById('edges');
  const gNodes = document.getElementById('nodes');
  const tempEdge = document.getElementById('temp');

  // Generic Custom Dropdown
  function createCustomSelect(container, id, options, defaultValue, onChange) {
    if (!container) return;
    container.innerHTML = '';
    const select = document.createElement('div');
    select.className = 'custom-select';
    select.id = id;
    select.dataset.value = defaultValue;
    
    const selectedOption = options.find(o => o.value === defaultValue) || options[0];
    const triggerLabel = selectedOption ? selectedOption.label : 'Select...';
    
    select.innerHTML = `
      <div class="custom-select-trigger">
        <span>${triggerLabel}</span>
        <span class="chevron">▼</span>
      </div>
      <div class="custom-select-options">
        ${options.map(opt => `
          <div class="custom-select-option ${opt.value === defaultValue ? 'selected' : ''}" data-value="${opt.value}">
            ${opt.label}
          </div>
        `).join('')}
      </div>
    `;
    
    const trigger = select.querySelector('.custom-select-trigger');
    const optionEls = select.querySelectorAll('.custom-select-option');
    
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      document.querySelectorAll('.custom-select').forEach(other => {
        if (other !== select) other.classList.remove('open');
      });
      select.classList.toggle('open');
    });
    
    optionEls.forEach(opt => {
      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        const val = opt.dataset.value;
        const label = opt.textContent.trim();
        select.dataset.value = val;
        trigger.querySelector('span').textContent = label;
        select.classList.remove('open');
        
        optionEls.forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        
        if (onChange) onChange(val);
      });
    });
    
    container.appendChild(select);
  }

  function setCustomSelectValue(id, value) {
    const select = document.getElementById(id);
    if (!select) return;
    const option = select.querySelector(`.custom-select-option[data-value="${value}"]`);
    if (!option) return;
    select.dataset.value = value;
    select.querySelector('.custom-select-trigger span').textContent = option.textContent.trim();
    select.querySelectorAll('.custom-select-option').forEach(o => o.classList.remove('selected'));
    option.classList.add('selected');
  }

  function snapshot() {
    return JSON.stringify({
      name: state.name, nodes: state.nodes, edges: state.edges, streams: state.streams,
      nodeIdCounter: state.nodeIdCounter, edgeIdCounter: state.edgeIdCounter, streamIdCounter: state.streamIdCounter,
      dials: state.dials,
      genState: (typeof window.genState !== 'undefined') ? window.genState : null
    });
  }
  
  function pushHistory() {
    history.stack = history.stack.slice(0, history.pointer + 1);
    history.stack.push(snapshot());
    if (history.stack.length > history.max) history.stack.shift();
    else history.pointer++;
  }
  
  function restore(json) {
    const d = JSON.parse(json);
    state.name = d.name || 'Untitled topology';
    state.nodes = d.nodes || [];
    state.edges = d.edges || [];
    state.streams = d.streams || [];
    const maxId = arr => arr.reduce((m, x) => Math.max(m, parseInt((x.id || '0').slice(1)) || 0), 0) + 1;
    state.nodeIdCounter = d.nodeIdCounter || maxId(state.nodes);
    state.edgeIdCounter = d.edgeIdCounter || maxId(state.edges);
    state.streamIdCounter = d.streamIdCounter || maxId(state.streams);
    state.dials = d.dials || { gate: 'puzzle', decoy: 'single', recontext: 'none', res: 'coupled' };

    if (typeof window.genState !== 'undefined' && d.genState) {
      window.genState.currentStep = d.genState.currentStep || 2;
      window.genState.stepStatus = d.genState.stepStatus || { 2: 'ready', 3: 'locked', 3.5: 'locked', 4: 'locked', 4.5: 'locked', 5: 'locked', 6: 'locked', 7: 'locked' };
      window.genState.stepData = d.genState.stepData || { 2: null, 3: null, 3.5: null, 4: null, 4.5: null, 5: null, 6: {}, 7: null };
      
      if (document.getElementById('generator-tab-content') && window.setActiveStep) {
        window.setActiveStep(window.genState.currentStep);
      }
    }

    state.nodes.forEach(n => {
      n.w = n.w || 180;
      n.h = n.h || 64;
      n.notes = n.notes || '';
    });

    state.selectedNode = null; state.selectedEdge = null;
    document.getElementById('proj-name').value = state.name;
    setCustomSelectValue('dial-gate', state.dials.gate);
    setCustomSelectValue('dial-decoy', state.dials.decoy);
    setCustomSelectValue('dial-recontext', state.dials.recontext);
    setCustomSelectValue('dial-res', state.dials.res);
    render(); validate();
  }
  
  function undo() {
    if (history.pointer > 0) {
      history.pointer--;
      restore(history.stack[history.pointer]);
      showToast('Undo executed', 'info');
    }
  }
  
  function redo() {
    if (history.pointer < history.stack.length - 1) {
      history.pointer++;
      restore(history.stack[history.pointer]);
      showToast('Redo executed', 'info');
    }
  }

  function getNodeType(id) { for (const g of NODE_TYPES) for (const it of g.items) if (it.id === id) return it; return null; }
  function getEdgeType(id) { return EDGE_TYPES.find(e => e.id === id); }

  function buildPalette() {
    const root = document.getElementById('palette');
    root.innerHTML = '';
    NODE_TYPES.forEach(group => {
      const header = document.createElement('div');
      header.className = 'palette-group-header';
      header.innerHTML = `<span>${group.group}</span><span class="chevron">▼</span>`;
      
      const content = document.createElement('div');
      content.className = 'palette-group-content';
      
      header.addEventListener('click', () => {
        const isCollapsed = content.classList.toggle('collapsed');
        header.classList.toggle('collapsed', isCollapsed);
      });
      
      group.items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'item';
        div.draggable = true;
        div.dataset.nodeTypeId = item.id;
        
        div.innerHTML = `
          <span class="sw" style="color: ${item.accent}"></span>
          <span class="title">${item.label}</span>
        `;
        
        div.addEventListener('dragstart', ev => {
          ev.dataTransfer.setData('application/x-node-type', item.id);
          ev.dataTransfer.effectAllowed = 'copy';
        });
        
        content.appendChild(div);
      });
      
      root.appendChild(header);
      root.appendChild(content);
    });
  }

  function addNode(typeId, x, y) {
    const t = getNodeType(typeId);
    if (!t) return null;
    const n = {
      id: 'n' + state.nodeIdCounter++,
      type: typeId,
      label: 'New ' + t.label.toLowerCase(),
      x: x,
      y: y,
      w: 180,
      h: 64,
      streamId: null,
      notes: ''
    };
    state.nodes.push(n);
    return n;
  }

  function addEdge(srcId, tgtId, type = 'prereq') {
    if (srcId === tgtId) return false;
    if (state.edges.some(e => e.src === srcId && e.tgt === tgtId)) return false;
    
    state.edges.push({
      id: 'e' + state.edgeIdCounter++,
      src: srcId,
      tgt: tgtId,
      type: type,
      notes: ''
    });
    return true;
  }

  // Drag and drop node creation from palette
  svg.addEventListener('dragover', ev => {
    ev.preventDefault();
    ev.dataTransfer.dropEffect = 'copy';
  });

  svg.addEventListener('drop', ev => {
    ev.preventDefault();
    const typeId = ev.dataTransfer.getData('application/x-node-type');
    if (!typeId) return;
    
    const p = svgPoint(ev);
    if (addNode(typeId, p.x, p.y)) {
      pushHistory(); render(); validate();
      showToast('Node placed', 'success');
    }
  });

  function svgPoint(ev) {
    const pt = svg.createSVGPoint();
    pt.x = ev.clientX;
    pt.y = ev.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  }

  // Node connection dragging
  let connectDrag = null;
  function startConnectDrag(nodeId, ev) {
    ev.preventDefault();
    ev.stopPropagation();
    
    const n = state.nodes.find(x => x.id === nodeId);
    if (!n) return;
    
    connectDrag = { srcId: nodeId, sx: n.x + n.w / 2, sy: n.y };
    svg.classList.add('connecting');
    
    window.addEventListener('mousemove', connectDragMove);
    window.addEventListener('mouseup', connectDragEnd);
  }

  function connectDragMove(e) {
    if (!connectDrag) return;
    const p = svgPoint(e);
    
    while (tempEdge.firstChild) tempEdge.removeChild(tempEdge.firstChild);
    
    const path = document.createElementNS(NS, 'line');
    path.setAttribute('x1', connectDrag.sx);
    path.setAttribute('y1', connectDrag.sy);
    path.setAttribute('x2', p.x);
    path.setAttribute('y2', p.y);
    path.setAttribute('stroke', '#ff007f');
    path.setAttribute('stroke-width', '1.5');
    path.setAttribute('stroke-dasharray', '4 4');
    tempEdge.appendChild(path);
  }

  function connectDragEnd(e) {
    if (!connectDrag) return;
    window.removeEventListener('mousemove', connectDragMove);
    window.removeEventListener('mouseup', connectDragEnd);
    
    svg.classList.remove('connecting');
    while (tempEdge.firstChild) tempEdge.removeChild(tempEdge.firstChild);
    
    const target = e.target.closest('.node-group');
    if (target) {
      const tgtId = target.dataset.nodeId;
      if (tgtId && tgtId !== connectDrag.srcId) {
        // Choose edge type based on target node
        const tgtNode = state.nodes.find(x => x.id === tgtId);
        let et = 'prereq';
        if (tgtNode) {
          if (tgtNode.type === 'and') et = 'and-in';
          else if (tgtNode.type === 'or') et = 'or-in';
          else if (tgtNode.type === 'elim') et = 'elim';
        }
        
        if (addEdge(connectDrag.srcId, tgtId, et)) {
          pushHistory(); render(); validate();
          showToast('Connection established', 'success');
        }
      }
    }
    
    connectDrag = null;
  }

  // Node Dragging
  window.addEventListener('mousemove', e => {
    if (!state.drag) return;
    const p = svgPoint(e);
    const n = state.nodes.find(x => x.id === state.drag.id);
    if (!n) return;
    
    let rawX = p.x - state.drag.offX;
    let rawY = p.y - state.drag.offY;
    if (state.snapToGrid) {
      n.x = Math.round(rawX / 20) * 20;
      n.y = Math.round(rawY / 20) * 20;
    } else {
      n.x = Math.round(rawX);
      n.y = Math.round(rawY);
    }
    state.drag.moved = true;
    render();
  });

  window.addEventListener('mouseup', () => {
    if (state.drag && state.drag.moved) pushHistory();
    state.drag = null;
  });

  svg.addEventListener('click', e => {
    if (e.target === svg || e.target.id === 'grid-rect') {
      state.selectedNode = null; state.selectedEdge = null; render();
    }
  });

  function selectNode(id) { state.selectedNode = id; state.selectedEdge = null; render(); renderInspector(); }
  function selectEdge(id) { state.selectedEdge = id; state.selectedNode = null; render(); renderInspector(); }

  // Inspector render
  function renderInspector() {
    const body = document.getElementById('inspector-body');
    if (!body) return;
    
    body.classList.remove('empty');
    body.innerHTML = '';

    if (state.selectedNode) {
      const n = state.nodes.find(x => x.id === state.selectedNode);
      if (!n) return;
      const t = getNodeType(n.type);

      const desc = document.createElement('div');
      desc.className = 'desc';
      desc.textContent = t.desc;
      body.appendChild(desc);

      const fLabel = document.createElement('div');
      fLabel.className = 'field';
      fLabel.innerHTML = `
        <label>Label</label>
        <input type="text" id="ins-label" value="${n.label}">
      `;
      body.appendChild(fLabel);

      const fNotes = document.createElement('div');
      fNotes.className = 'field';
      fNotes.innerHTML = `
        <label>Description / Notes</label>
        <textarea id="ins-notes">${n.notes || ''}</textarea>
      `;
      body.appendChild(fNotes);

      // Stream selection dropdown
      const fStream = document.createElement('div');
      fStream.className = 'field';
      fStream.innerHTML = `<label>Stream Association</label><div id="ins-select-stream"></div>`;
      body.appendChild(fStream);

      const streamOptions = [{ value: 'none', label: 'None (Standalone)' }];
      state.streams.forEach(s => streamOptions.push({ value: s.id, label: s.name }));
      
      createCustomSelect(
        document.getElementById('ins-select-stream'),
        'select-stream',
        streamOptions,
        n.streamId || 'none',
        val => {
          n.streamId = val === 'none' ? null : val;
          pushHistory(); render(); validate();
        }
      );

      const delBtn = document.createElement('button');
      delBtn.className = 'btn danger';
      delBtn.textContent = 'Delete Node';
      delBtn.addEventListener('click', () => {
        state.edges = state.edges.filter(ed => ed.src !== n.id && ed.tgt !== n.id);
        state.nodes = state.nodes.filter(x => x.id !== n.id);
        state.selectedNode = null;
        pushHistory(); render(); validate();
        showToast('Node deleted', 'warning');
      });
      body.appendChild(delBtn);

      // Listeners for inline updates
      document.getElementById('ins-label').addEventListener('input', e => {
        n.label = e.target.value;
        render();
      });
      document.getElementById('ins-label').addEventListener('change', () => {
        pushHistory();
      });
      document.getElementById('ins-notes').addEventListener('change', e => {
        n.notes = e.target.value;
        pushHistory();
      });
    } else if (state.selectedEdge) {
      const edge = state.edges.find(x => x.id === state.selectedEdge);
      if (!edge) return;
      const et = getEdgeType(edge.type);

      const desc = document.createElement('div');
      desc.className = 'desc';
      desc.textContent = et.explain;
      body.appendChild(desc);

      const fType = document.createElement('div');
      fType.className = 'field';
      fType.innerHTML = `<label>Connection Logic Type</label><div id="ins-select-edge-type"></div>`;
      body.appendChild(fType);

      const edgeOptions = EDGE_TYPES.map(e => ({ value: e.id, label: e.label }));
      createCustomSelect(
        document.getElementById('ins-select-edge-type'),
        'select-edge-type',
        edgeOptions,
        edge.type,
        val => {
          edge.type = val;
          pushHistory(); render(); validate();
        }
      );

      const fNotes = document.createElement('div');
      fNotes.className = 'field';
      fNotes.innerHTML = `
        <label>Logical Premise / Notes</label>
        <textarea id="ins-notes">${edge.notes || ''}</textarea>
      `;
      body.appendChild(fNotes);

      const delBtn = document.createElement('button');
      delBtn.className = 'btn danger';
      delBtn.textContent = 'Delete Connection';
      delBtn.addEventListener('click', () => {
        state.edges = state.edges.filter(x => x.id !== edge.id);
        state.selectedEdge = null;
        pushHistory(); render(); validate();
        showToast('Connection deleted', 'warning');
      });
      body.appendChild(delBtn);

      document.getElementById('ins-notes').addEventListener('change', e => {
        edge.notes = e.target.value;
        pushHistory();
      });
    } else {
      body.className = 'empty';
      body.textContent = 'Nothing selected.';
    }
  }

  // Streams controller
  function renderStreams() {
    const list = document.getElementById('streams');
    if (!list) return;
    
    list.innerHTML = '';
    
    state.streams.forEach(s => {
      const row = document.createElement('div');
      row.className = 'stream-row';
      
      const nodeCount = state.nodes.filter(n => n.streamId === s.id).length;
      
      row.innerHTML = `
        <span class="sw" style="color: ${s.color}"></span>
        <span class="name">${s.name}</span>
        <span class="type-tag">${s.type}</span>
        <span class="count">${nodeCount}</span>
        <button class="del" title="Delete Stream">×</button>
      `;
      
      // Inline edit stream name
      row.querySelector('.name').addEventListener('click', () => {
        const newName = prompt('Enter new stream name:', s.name);
        if (newName && newName.trim()) {
          s.name = newName.trim();
          pushHistory(); renderStreams(); render();
        }
      });
      
      row.querySelector('.del').addEventListener('click', e => {
        e.stopPropagation();
        if (confirm(`Delete stream "${s.name}"? Nodes will be kept but disconnected from the stream.`)) {
          state.nodes.forEach(n => { if (n.streamId === s.id) n.streamId = null; });
          state.streams = state.streams.filter(x => x.id !== s.id);
          pushHistory(); renderStreams(); render(); validate();
          showToast('Stream deleted', 'warning');
        }
      });
      
      list.appendChild(row);
    });
    
    // Stats update
    const stats = document.getElementById('stats');
    if (stats) {
      stats.innerHTML = `
        <div class="stat"><strong>${state.nodes.length}</strong><span>Nodes</span></div>
        <div class="stat"><strong>${state.edges.length}</strong><span>Edges</span></div>
        <div class="stat"><strong>${state.streams.length}</strong><span>Streams</span></div>
      `;
    }
  }

  document.getElementById('add-stream').addEventListener('click', () => {
    const name = prompt('Enter Stream Name:', `Stream ${state.streamIdCounter}`);
    if (!name || !name.trim()) return;
    
    const host = document.getElementById('modal-host');
    host.innerHTML = '';
    
    const back = document.createElement('div');
    back.className = 'modal-backdrop';
    
    const m = document.createElement('div');
    m.className = 'modal';
    
    m.innerHTML = `
      <h3>Create Narrative Stream</h3>
      <p>Group logical tracks into a colored stream structure to organize complexity.</p>
      <div class="field">
        <label>Stream Type</label>
        <select id="stream-creation-type" style="width:100%; height:32px; background:rgba(0,0,0,0.4); border:1px solid var(--border-light); border-radius:var(--radius-sm); color:var(--text-primary); padding:0 8px;">
          ${STREAM_TYPES.map(t => `<option value="${t}">${t.toUpperCase()}</option>`).join('')}
        </select>
      </div>
      <div class="row">
        <button id="stream-creation-cancel">Cancel</button>
        <button id="stream-creation-ok" class="primary">Create</button>
      </div>
    `;
    
    back.appendChild(m); host.appendChild(back);
    
    document.getElementById('stream-creation-cancel').addEventListener('click', () => { host.innerHTML = ''; });
    document.getElementById('stream-creation-ok').addEventListener('click', () => {
      const type = document.getElementById('stream-creation-type').value;
      const color = STREAM_COLORS[state.streamIdCounter % STREAM_COLORS.length];
      
      state.streams.push({
        id: 'st' + state.streamIdCounter++,
        name: name.trim(),
        type: type,
        color: color
      });
      
      host.innerHTML = '';
      pushHistory(); renderStreams(); render(); validate();
      showToast('Stream created', 'success');
    });
  });

  // Main drawing logic
  function render() {
    while (gEdges.firstChild) gEdges.removeChild(gEdges.firstChild);
    while (gNodes.firstChild) gNodes.removeChild(gNodes.firstChild);

    state.edges.forEach(edge => {
      const s = state.nodes.find(n => n.id === edge.src);
      const t = state.nodes.find(n => n.id === edge.tgt);
      if (!s || !t) return;
      
      const dx = t.x - s.x;
      const dy = t.y - s.y;
      const len = Math.max(1, Math.hypot(dx, dy));
      
      const sxOff = (dx / len) * (s.w / 2 + 2);
      const syOff = (dy / len) * (s.h / 2 + 2);
      const txOff = (dx / len) * (t.w / 2 + 8);
      const tyOff = (dy / len) * (t.h / 2 + 8);
      
      const x1 = s.x + sxOff;
      const y1 = s.y + syOff;
      const x2 = t.x - txOff;
      const y2 = t.y - tyOff;
      
      const mx = (x1 + x2) / 2 + (y2 - y1) * 0.1;
      const my = (y1 + y2) / 2 - (x2 - x1) * 0.1;
      const d = `M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`;
      
      const et = getEdgeType(edge.type);

      const hit = document.createElementNS(NS, 'path');
      hit.setAttribute('d', d);
      hit.setAttribute('class', 'edge-hit');
      hit.dataset.edgeId = edge.id;
      hit.addEventListener('click', ev => { ev.stopPropagation(); selectEdge(edge.id); });
      gEdges.appendChild(hit);

      const path = document.createElementNS(NS, 'path');
      path.setAttribute('d', d);
      path.setAttribute('class', 'edge-path' + (state.selectedEdge === edge.id ? ' sel' : ''));
      path.setAttribute('stroke', et.color);
      if (et.dash) {
        path.setAttribute('stroke-dasharray', et.dash);
      }
      path.setAttribute('marker-end', 'url(#' + et.marker + ')');
      
      if (state.selectedEdge === edge.id) {
        path.style.filter = `drop-shadow(0 0 8px ${et.color})`;
      }
      gEdges.appendChild(path);
    });

    state.nodes.forEach(node => {
      const t = getNodeType(node.type);
      if (!t) return;
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('transform', 'translate(' + (node.x - node.w / 2) + ' ' + (node.y - node.h / 2) + ')');
      g.setAttribute('class', 'node-group');
      g.dataset.nodeId = node.id;
      
      const nodeColor = node.streamId ? state.streams.find(s => s.id === node.streamId)?.color || t.accent : t.accent;
      
      if (state.selectedNode === node.id) {
        g.style.filter = `drop-shadow(0 0 10px ${nodeColor})`;
      }

      const rect = document.createElementNS(NS, 'rect');
      rect.setAttribute('width', node.w);
      rect.setAttribute('height', node.h);
      rect.setAttribute('rx', 2);
      rect.setAttribute('fill', 'rgba(6, 4, 10, 0.95)');
      rect.setAttribute('stroke', nodeColor);
      rect.setAttribute('stroke-width', state.selectedNode === node.id ? 2.5 : 1.5);
      rect.setAttribute('class', 'node-rect' + (state.selectedNode === node.id ? ' sel' : ''));
      g.appendChild(rect);

      const bar = document.createElementNS(NS, 'rect');
      bar.setAttribute('x', 10); bar.setAttribute('y', 12);
      bar.setAttribute('width', 3); bar.setAttribute('height', node.h - 24);
      bar.setAttribute('rx', 1); bar.setAttribute('fill', nodeColor);
      bar.setAttribute('pointer-events', 'none');
      g.appendChild(bar);

      const iconGroup = document.createElementNS(NS, 'g');
      iconGroup.setAttribute('transform', 'translate(20, ' + (node.h / 2 - 9) + ') scale(0.75)');
      iconGroup.setAttribute('pointer-events', 'none');
      const iconPath = document.createElementNS(NS, 'path');
      iconPath.setAttribute('d', t.icon || 'M12 2v20');
      iconPath.setAttribute('stroke', nodeColor);
      iconPath.setAttribute('stroke-width', '2.25');
      iconPath.setAttribute('stroke-linecap', 'round');
      iconPath.setAttribute('stroke-linejoin', 'round');
      iconPath.setAttribute('fill', 'none');
      iconGroup.appendChild(iconPath);
      g.appendChild(iconGroup);

      const lbl = document.createElementNS(NS, 'text');
      lbl.setAttribute('x', 46);
      lbl.setAttribute('y', node.h / 2 - 5);
      lbl.setAttribute('dominant-baseline', 'central');
      lbl.setAttribute('class', 'node-label');
      lbl.setAttribute('fill', '#ffffff');
      lbl.textContent = node.label.length > 18 ? node.label.slice(0, 16) + '…' : node.label;
      g.appendChild(lbl);

      const typ = document.createElementNS(NS, 'text');
      typ.setAttribute('x', 46);
      typ.setAttribute('y', node.h - 14);
      typ.setAttribute('class', 'node-type');
      typ.setAttribute('fill', nodeColor);
      typ.textContent = t.label;
      g.appendChild(typ);

      // Draw fact allocation count badge if present
      if (typeof window.genState !== 'undefined' && window.genState.stepData[5] && window.genState.stepData[5].node_allocations) {
        const factCount = (window.genState.stepData[5].node_allocations[node.id] || []).length;
        if (factCount > 0) {
          const badgeGroup = document.createElementNS(NS, 'g');
          badgeGroup.setAttribute('transform', 'translate(' + (node.w - 5) + ', 5)');
          badgeGroup.setAttribute('pointer-events', 'none');
          
          const badgeCircle = document.createElementNS(NS, 'circle');
          badgeCircle.setAttribute('r', 8);
          badgeCircle.setAttribute('fill', 'var(--cyber-yellow)');
          badgeCircle.setAttribute('stroke', '#040207');
          badgeCircle.setAttribute('stroke-width', '1.5');
          badgeGroup.appendChild(badgeCircle);
          
          const badgeText = document.createElementNS(NS, 'text');
          badgeText.setAttribute('text-anchor', 'middle');
          badgeText.setAttribute('dominant-baseline', 'central');
          badgeText.setAttribute('fill', '#040207');
          badgeText.setAttribute('font-size', '8px');
          badgeText.setAttribute('font-weight', '900');
          badgeText.textContent = factCount;
          badgeGroup.appendChild(badgeText);
          
          g.appendChild(badgeGroup);
        }
      }

      const port = document.createElementNS(NS, 'circle');
      port.setAttribute('cx', node.w); port.setAttribute('cy', node.h / 2);
      port.setAttribute('r', 5.5); port.setAttribute('class', 'port');
      port.setAttribute('stroke', nodeColor); port.setAttribute('fill', 'rgba(10,10,16,0.95)');
      port.addEventListener('mousedown', ev => { ev.stopPropagation(); startConnectDrag(node.id, ev); });
      g.appendChild(port);

      g.addEventListener('mousedown', ev => {
        if (ev.target === port) return;
        if (state.mode === 'connect') {
          if (!state.connectFrom) { state.connectFrom = node.id; selectNode(node.id); }
          else {
            if (addEdge(state.connectFrom, node.id)) pushHistory();
            state.connectFrom = null; render(); validate();
          }
          return;
        }
        selectNode(node.id);
        const p = svgPoint(ev);
        state.drag = { id: node.id, offX: p.x - node.x, offY: p.y - node.y, moved: false };
      });
      gNodes.appendChild(g);
    });

    renderStreams();
    updateMinimap();
  }

  function validate() {
    const v = document.getElementById('validator');
    if (!v) return;
    v.innerHTML = '';
    const msgs = [];
    const adj = {};
    state.nodes.forEach(n => adj[n.id] = []);
    state.edges.forEach(e => { if (e.type !== 'recontext' && adj[e.src]) adj[e.src].push(e.tgt); });

    const color = {};
    function dfs(id) {
      color[id] = 1;
      for (const t of adj[id] || []) {
        if (color[t] === 1) return true;
        if (color[t] === undefined && dfs(t)) return true;
      }
      color[id] = 2;
      return false;
    }
    let cycle = false;
    for (const n of state.nodes) if (color[n.id] === undefined && dfs(n.id)) { cycle = true; break; }
    if (cycle) msgs.push({ kind: 'err', text: 'Cycle detected in non-recontext edges. Mark backward edges as recontextualisation.' });

    const entries = state.nodes.filter(n => n.type === 'entry');
    const termini = state.nodes.filter(n => n.type === 'terminus');
    if (state.nodes.length > 0 && entries.length === 0) msgs.push({ kind: 'warn', text: 'No entry node placed.' });
    if (state.nodes.length > 0 && termini.length === 0) msgs.push({ kind: 'warn', text: 'No terminus node placed.' });
    if (entries.length > 1) {
      entries.forEach(n => msgs.push({ kind: 'warn', text: 'Multiple entry node placed: "' + n.label + '".', nodeId: n.id }));
    }
    if (termini.length > 1) {
      termini.forEach(n => msgs.push({ kind: 'warn', text: 'Multiple terminus node placed: "' + n.label + '".', nodeId: n.id }));
    }

    if (entries.length === 1) {
      const reachable = new Set([entries[0].id]);
      const q = [entries[0].id];
      while (q.length) {
        const x = q.shift();
        for (const t of adj[x] || []) if (!reachable.has(t)) { reachable.add(t); q.push(t); }
      }
      const unreached = state.nodes.filter(n => !reachable.has(n.id) && n.type !== 'entry');
      if (unreached.length > 0) {
        msgs.push({ 
          kind: 'warn', 
          text: unreached.length + ' node(s) unreachable from entry: ' + unreached.map(n => n.label).slice(0, 3).join(', ') + (unreached.length > 3 ? '…' : ''),
          nodeId: unreached[0].id 
        });
      }
    }
    
    if (termini.length === 1) {
      const radj = {};
      state.nodes.forEach(n => radj[n.id] = []);
      state.edges.forEach(e => { if (e.type !== 'recontext' && radj[e.tgt]) radj[e.tgt].push(e.src); });
      const back = new Set([termini[0].id]);
      const q = [termini[0].id];
      while (q.length) {
        const x = q.shift();
        for (const s of radj[x] || []) if (!back.has(s)) { back.add(s); q.push(s); }
      }
      const dead = state.nodes.filter(n => !back.has(n.id) && n.type !== 'terminus');
      if (dead.length > 0) {
        msgs.push({ 
          kind: 'warn', 
          text: dead.length + ' node(s) cannot reach terminus: ' + dead.map(n => n.label).slice(0, 3).join(', ') + (dead.length > 3 ? '…' : ''),
          nodeId: dead[0].id 
        });
      }
    }

    state.nodes.filter(n => n.type === 'and').forEach(n => {
      const ins = state.edges.filter(e => e.tgt === n.id && (e.type === 'and-in' || e.type === 'prereq')).length;
      if (ins < 2) msgs.push({ kind: 'warn', text: 'Convergence "' + n.label + '" has fewer than 2 inputs.', nodeId: n.id });
    });
    state.nodes.filter(n => n.type === 'false-res').forEach(n => {
      const out = state.edges.filter(e => e.src === n.id);
      if (!out.some(e => e.type === 'recontext' || e.type === 'elim')) {
        msgs.push({ kind: 'warn', text: 'False resolution "' + n.label + '" has no recontextualisation or elimination edge out.', nodeId: n.id });
      }
    });
    state.nodes.filter(n => n.type === 'herring').forEach(n => {
      if (state.edges.filter(e => e.src === n.id).length === 0) {
        msgs.push({ kind: 'warn', text: 'Red herring "' + n.label + '" does not resolve.', nodeId: n.id });
      }
    });

    const recontextCount = state.edges.filter(e => e.type === 'recontext').length;
    if (state.dials.recontext === 'none' && recontextCount > 0) msgs.push({ kind: 'info', text: 'Dial says no recontextualisation but ' + recontextCount + ' recontext edge(s) present.' });
    
    const decoyCount = state.nodes.filter(n => n.type === 'decoy' || n.type === 'false-res').length;
    if (state.dials.decoy !== 'none' && decoyCount === 0) msgs.push({ kind: 'info', text: 'Decoy dial active but no decoy / false-resolution nodes.' });

    if (state.nodes.length === 0) msgs.push({ kind: 'info', text: 'Empty canvas. Drag nodes from the left palette to begin.' });
    else if (msgs.length === 0) msgs.push({ kind: 'ok', text: 'No structural problems detected.' });

    const errors = msgs.filter(m => m.kind === 'err').length;
    const warnings = msgs.filter(m => m.kind === 'warn').length;
    
    const dot = document.getElementById('validator-status-dot');
    const badge = document.getElementById('validator-count-badge');
    
    if (dot && badge) {
      dot.className = 'pulse-indicator';
      if (errors > 0) {
        dot.classList.add('error');
        badge.textContent = `${errors} ${errors === 1 ? 'Error' : 'Errors'}`;
        badge.style.background = 'var(--error-bg)';
        badge.style.color = 'var(--error)';
      } else if (warnings > 0) {
        dot.classList.add('warning');
        badge.textContent = `${warnings} ${warnings === 1 ? 'Warning' : 'Warnings'}`;
        badge.style.background = 'var(--warning-bg)';
        badge.style.color = 'var(--warning)';
      } else {
        badge.textContent = 'All Good';
        badge.style.background = 'var(--success-bg)';
        badge.style.color = 'var(--success)';
      }
    }

    msgs.forEach(m => {
      const row = document.createElement('div');
      row.className = 'v-row';
      if (m.nodeId) {
        row.classList.add('clickable');
        row.addEventListener('click', () => focusNode(m.nodeId));
      }
      
      const b = document.createElement('span');
      b.className = 'badge b-' + (m.kind === 'err' ? 'err' : m.kind === 'warn' ? 'warn' : m.kind === 'ok' ? 'ok' : 'info');
      b.textContent = m.kind === 'err' ? 'error' : m.kind === 'warn' ? 'warning' : m.kind === 'ok' ? 'ok' : 'info';
      
      const t = document.createElement('span');
      t.className = 'v-text';
      t.textContent = m.text;
      
      row.appendChild(b);
      row.appendChild(t);
      v.appendChild(row);
    });
  }

  // Setup Initial ViewBox scaled
  let viewBoxState = { x: 700, y: 1000, w: 1600, h: 1000 };
  svg.setAttribute('viewBox', '700 1000 1600 1000');

  function fitView() {
    if (!state.nodes.length) return;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    state.nodes.forEach(n => {
      minX = Math.min(minX, n.x - n.w);
      minY = Math.min(minY, n.y - n.h);
      maxX = Math.max(maxX, n.x + n.w);
      maxY = Math.max(maxY, n.y + n.h);
    });
    
    const pad = 150;
    const targetX = minX - pad;
    const targetY = minY - pad;
    const targetW = (maxX - minX) + pad * 2;
    const targetH = (maxY - minY) + pad * 2;
    
    const startX = viewBoxState.x;
    const startY = viewBoxState.y;
    const startW = viewBoxState.w;
    const startH = viewBoxState.h;
    
    const duration = 400;
    const startTime = performance.now();
    
    function anim(now) {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - progress, 3);
      
      viewBoxState.x = startX + (targetX - startX) * ease;
      viewBoxState.y = startY + (targetY - startY) * ease;
      viewBoxState.w = startW + (targetW - startW) * ease;
      viewBoxState.h = startH + (targetH - startH) * ease;
      
      svg.setAttribute('viewBox', `${viewBoxState.x} ${viewBoxState.y} ${viewBoxState.w} ${viewBoxState.h}`);
      updateMinimap();
      if (progress < 1) requestAnimationFrame(anim);
    }
    requestAnimationFrame(anim);
  }

  function focusNode(nodeId) {
    const n = state.nodes.find(x => x.id === nodeId);
    if (!n) return;
    selectNode(n.id);
    
    const targetX = n.x - viewBoxState.w / 2;
    const targetY = n.y - viewBoxState.h / 2;
    
    const startX = viewBoxState.x;
    const startY = viewBoxState.y;
    const duration = 300;
    const startTime = performance.now();
    
    function anim(now) {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const ease = progress * (2 - progress);
      
      viewBoxState.x = startX + (targetX - startX) * ease;
      viewBoxState.y = startY + (targetY - startY) * ease;
      svg.setAttribute('viewBox', `${viewBoxState.x} ${viewBoxState.y} ${viewBoxState.w} ${viewBoxState.h}`);
      updateMinimap();
      
      if (progress < 1) {
        requestAnimationFrame(anim);
      } else {
        const nodeEl = document.querySelector(`g[data-node-id="${nodeId}"]`);
        if (nodeEl) {
          nodeEl.classList.add('flash-glow');
          setTimeout(() => nodeEl.classList.remove('flash-glow'), 1200);
        }
      }
    }
    requestAnimationFrame(anim);
  }

  svg.addEventListener('wheel', e => {
    e.preventDefault();
    const rect = svg.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const canvasX = viewBoxState.x + (mouseX / rect.width) * viewBoxState.w;
    const canvasY = viewBoxState.y + (mouseY / rect.height) * viewBoxState.h;
    
    const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
    const nextW = viewBoxState.w * zoomFactor;
    if (nextW < 200 || nextW > 10000) return;
    
    viewBoxState.w = nextW;
    viewBoxState.h = viewBoxState.h * zoomFactor;
    viewBoxState.x = canvasX - (canvasX - viewBoxState.x) * zoomFactor;
    viewBoxState.y = canvasY - (canvasY - viewBoxState.y) * zoomFactor;
    
    svg.setAttribute('viewBox', `${viewBoxState.x} ${viewBoxState.y} ${viewBoxState.w} ${viewBoxState.h}`);
    updateMinimap();
  }, { passive: false });

  let pan = null;
  let spacePressed = false;

  window.addEventListener('keydown', e => {
    if (e.key === ' ' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
      spacePressed = true;
      svg.style.cursor = 'grab';
    }
  });
  window.addEventListener('keyup', e => {
    if (e.key === ' ') {
      spacePressed = false;
      svg.style.cursor = state.mode === 'connect' ? 'crosshair' : 'grab';
    }
  });

  svg.addEventListener('mousedown', e => {
    if (e.button === 1 || e.button === 2 || spacePressed || e.target === svg || e.target.id === 'grid-rect') {
      e.preventDefault();
      pan = { x: e.clientX, y: e.clientY, vx: viewBoxState.x, vy: viewBoxState.y };
      svg.style.cursor = 'grabbing';
    }
  });

  window.addEventListener('mousemove', e => {
    if (!pan) return;
    const dx = (e.clientX - pan.x) * (viewBoxState.w / svg.clientWidth);
    const dy = (e.clientY - pan.y) * (viewBoxState.h / svg.clientHeight);
    viewBoxState.x = pan.vx - dx;
    viewBoxState.y = pan.vy - dy;
    svg.setAttribute('viewBox', `${viewBoxState.x} ${viewBoxState.y} ${viewBoxState.w} ${viewBoxState.h}`);
    updateMinimap();
  });

  window.addEventListener('mouseup', () => {
    if (pan) {
      pan = null;
      svg.style.cursor = spacePressed ? 'grab' : (state.mode === 'connect' ? 'crosshair' : 'grab');
    }
  });

  function updateMinimap() {
    const mini = document.getElementById('minimap-svg');
    if (!mini) return;
    const miniViewport = document.getElementById('mini-viewport');
    const miniNodes = document.getElementById('mini-nodes');
    if (!miniViewport || !miniNodes) return;
    
    let minX = viewBoxState.x;
    let minY = viewBoxState.y;
    let maxX = viewBoxState.x + viewBoxState.w;
    let maxY = viewBoxState.y + viewBoxState.h;
    
    state.nodes.forEach(n => {
      minX = Math.min(minX, n.x - n.w);
      minY = Math.min(minY, n.y - n.h);
      maxX = Math.max(maxX, n.x + n.w);
      maxY = Math.max(maxY, n.y + n.h);
    });
    
    const pad = 100;
    minX -= pad; minY -= pad;
    maxX += pad; maxY += pad;
    const boundsW = maxX - minX;
    const boundsH = maxY - minY;
    
    mini.setAttribute('viewBox', `${minX} ${minY} ${boundsW} ${boundsH}`);
    miniViewport.setAttribute('x', viewBoxState.x);
    miniViewport.setAttribute('y', viewBoxState.y);
    miniViewport.setAttribute('width', viewBoxState.w);
    miniViewport.setAttribute('height', viewBoxState.h);
    
    while (miniNodes.firstChild) miniNodes.removeChild(miniNodes.firstChild);
    state.nodes.forEach(n => {
      const t = getNodeType(n.type);
      const circle = document.createElementNS(NS, 'circle');
      circle.setAttribute('cx', n.x);
      circle.setAttribute('cy', n.y);
      circle.setAttribute('r', 16);
      circle.setAttribute('fill', t ? t.accent : '#8b80ff');
      miniNodes.appendChild(circle);
    });
  }

  function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';
    if (type === 'warning') icon = '⚠️';
    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      toast.addEventListener('transitionend', () => toast.remove());
    }, 2800);
  }

  function adjustLayout() {
    const isPaletteCollapsed = document.getElementById('palette').classList.contains('collapsed');
    const isSidebarCollapsed = document.getElementById('sidebar').classList.contains('collapsed');
    
    const sidebarWidth = (typeof window.activeSidebarTab !== 'undefined' && window.activeSidebarTab === 'generator') ? 460 : 300;
    const rightMargin = isSidebarCollapsed ? 24 : (sidebarWidth + 24);
    
    const val = document.getElementById('validator-card');
    if (val) {
      val.style.left = isPaletteCollapsed ? '24px' : '284px';
      val.style.right = rightMargin + 'px';
    }
    const mm = document.getElementById('minimap-card');
    if (mm) {
      mm.style.right = rightMargin + 'px';
    }
    
    const tb = document.querySelector('.canvas-toolbar');
    if (tb) {
      tb.style.left = isPaletteCollapsed ? '48px' : '284px';
    }

    const toggle = document.getElementById('toggle-sidebar');
    if (toggle) {
      if (isSidebarCollapsed) {
        toggle.style.right = '12px';
      } else {
        toggle.style.right = (sidebarWidth + 12) + 'px';
      }
    }
  }

  document.getElementById('toggle-palette').addEventListener('click', () => {
    const p = document.getElementById('palette');
    const t = document.getElementById('toggle-palette');
    const collapsed = p.classList.toggle('collapsed');
    t.classList.toggle('collapsed-left', collapsed);
    t.innerHTML = collapsed ? '▶' : '◀';
    adjustLayout();
  });

  document.getElementById('toggle-sidebar').addEventListener('click', () => {
    const s = document.getElementById('sidebar');
    const t = document.getElementById('toggle-sidebar');
    const collapsed = s.classList.toggle('collapsed');
    t.classList.toggle('collapsed-right', collapsed);
    t.innerHTML = collapsed ? '◀' : '▶';
    adjustLayout();
  });

  document.getElementById('validator-header').addEventListener('click', () => {
    const card = document.getElementById('validator-card');
    const btn = document.getElementById('validator-toggle-btn');
    const isExpanded = card.classList.toggle('expanded');
    btn.textContent = isExpanded ? '▼' : '▲';
  });

  document.getElementById('tb-zoom-in').addEventListener('click', () => zoomCenter(0.85));
  document.getElementById('tb-zoom-out').addEventListener('click', () => zoomCenter(1.15));
  document.getElementById('tb-fit').addEventListener('click', fitView);
  
  function zoomCenter(scale) {
    const rect = svg.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const canvasX = viewBoxState.x + (cx / rect.width) * viewBoxState.w;
    const canvasY = viewBoxState.y + (cy / rect.height) * viewBoxState.h;
    
    viewBoxState.w *= scale;
    viewBoxState.h *= scale;
    viewBoxState.x = canvasX - (canvasX - viewBoxState.x) * scale;
    viewBoxState.y = canvasY - (canvasY - viewBoxState.y) * scale;
    
    svg.setAttribute('viewBox', `${viewBoxState.x} ${viewBoxState.y} ${viewBoxState.w} ${viewBoxState.h}`);
    updateMinimap();
  }

  document.getElementById('tb-snap').addEventListener('click', () => {
    state.snapToGrid = !state.snapToGrid;
    document.getElementById('tb-snap').classList.toggle('active', state.snapToGrid);
    showToast(state.snapToGrid ? 'Snap enabled (20px)' : 'Snap disabled', 'info');
  });

  document.getElementById('tb-grid').addEventListener('click', () => {
    const grid = document.getElementById('grid-rect');
    const gridActive = grid.style.display !== 'none';
    grid.style.display = gridActive ? 'none' : 'block';
    document.getElementById('tb-grid').classList.toggle('active', !gridActive);
    showToast(gridActive ? 'Grid hidden' : 'Grid visible', 'info');
  });

  document.getElementById('tb-minimap').addEventListener('click', () => {
    const mm = document.getElementById('minimap-card');
    const isVisible = mm.style.display !== 'none';
    mm.style.display = isVisible ? 'none' : 'flex';
    document.getElementById('tb-minimap').classList.toggle('active', !isVisible);
  });

  const gateOptions = [
    { value: 'puzzle', label: 'Puzzle-gated' },
    { value: 'commitment', label: 'Commitment-gated' },
    { value: 'both', label: 'Both' },
    { value: 'none', label: 'Ungated' }
  ];
  const decoyOptions = [
    { value: 'none', label: 'None' },
    { value: 'single', label: 'Single' },
    { value: 'nested', label: 'Nested' },
    { value: 'double', label: 'Double' }
  ];
  const recontextOptions = [
    { value: 'none', label: 'None' },
    { value: 'single', label: 'Single' },
    { value: 'multi', label: 'Multiple' }
  ];
  const resOptions = [
    { value: 'coupled', label: 'Coupled' },
    { value: 'decoupled', label: 'Decoupled' }
  ];

  function initTopbarSelects() {
    createCustomSelect(document.getElementById('topbar-select-gate'), 'dial-gate', gateOptions, state.dials.gate, val => {
      state.dials.gate = val;
      pushHistory(); validate();
    });
    createCustomSelect(document.getElementById('topbar-select-decoy'), 'dial-decoy', decoyOptions, state.dials.decoy, val => {
      state.dials.decoy = val;
      pushHistory(); validate();
    });
    createCustomSelect(document.getElementById('topbar-select-recontext'), 'dial-recontext', recontextOptions, state.dials.recontext, val => {
      state.dials.recontext = val;
      pushHistory(); validate();
    });
    createCustomSelect(document.getElementById('topbar-select-res'), 'dial-res', resOptions, state.dials.res, val => {
      state.dials.res = val;
      pushHistory(); validate();
    });
  }

  document.addEventListener('click', () => {
    document.querySelectorAll('.custom-select').forEach(sel => sel.classList.remove('open'));
  });

  // Topbar Buttons
  document.getElementById('btn-clear').addEventListener('click', () => {
    if (state.nodes.length && !confirm('Clear the entire canvas?')) return;
    state.nodes = []; state.edges = []; state.streams = [];
    state.selectedNode = null; state.selectedEdge = null;
    
    viewBoxState = { x: 700, y: 1000, w: 1600, h: 1000 };
    svg.setAttribute('viewBox', '700 1000 1600 1000');
    
    pushHistory(); render(); validate();
    showToast('Canvas cleared', 'warning');
  });

  document.getElementById('btn-undo').addEventListener('click', undo);
  document.getElementById('btn-redo').addEventListener('click', redo);

  document.getElementById('mode-select').addEventListener('click', () => {
    state.mode = 'select';
    document.getElementById('mode-select').classList.add('on');
    document.getElementById('mode-connect').classList.remove('on');
    svg.style.cursor = 'grab';
  });

  document.getElementById('mode-connect').addEventListener('click', () => {
    state.mode = 'connect';
    document.getElementById('mode-connect').classList.add('on');
    document.getElementById('mode-select').classList.remove('on');
    svg.style.cursor = 'crosshair';
  });

  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT' || e.target.closest('.custom-select')) return;
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return; }
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) { e.preventDefault(); redo(); return; }
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (state.selectedNode) {
        const id = state.selectedNode;
        state.edges = state.edges.filter(ed => ed.src !== id && ed.tgt !== id);
        state.nodes = state.nodes.filter(n => n.id !== id);
        state.selectedNode = null;
        pushHistory(); render(); validate();
        showToast('Node deleted', 'warning');
      } else if (state.selectedEdge) {
        state.edges = state.edges.filter(ed => ed.id !== state.selectedEdge);
        state.selectedEdge = null;
        pushHistory(); render(); validate();
        showToast('Edge deleted', 'warning');
      }
    }
    if (e.key === 'Escape') {
      state.selectedNode = null; state.selectedEdge = null; state.connectFrom = null;
      render();
    }
    if (e.key.toLowerCase() === 'c') document.getElementById('mode-connect').click();
    if (e.key.toLowerCase() === 's' && !e.ctrlKey && !e.metaKey) document.getElementById('mode-select').click();
  });

  // Project name field
  document.getElementById('proj-name').addEventListener('change', e => {
    state.name = e.target.value.trim() || 'Untitled topology';
    pushHistory();
  });

  // Expose necessary functions/state on window for external script access
  window.state = state;
  window.pushHistory = pushHistory;
  window.restore = restore;
  window.snapshot = snapshot;
  window.render = render;
  window.validate = validate;
  window.focusNode = focusNode;
  window.showToast = showToast;
  window.adjustLayout = adjustLayout;
  window.viewBoxState = viewBoxState;
  window.activeSidebarTab = 'inspector';

  // Initialize
  buildPalette();
  initTopbarSelects();
  pushHistory();
  render();
  validate();
  adjustLayout();
  setTimeout(() => fitView(), 120);

})();
