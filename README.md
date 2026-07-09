  # Deduction Topology Studio & Sequential Mystery Engine

Welcome to the **Deduction Topology Studio & Sequential Mystery Engine**—a professional visual graph editor and automated story generation studio. 

The application enables you to design the logical wiring diagram (Directed Acyclic Graph) of a complex deduction and sequentially compile a rich, logically consistent murder mystery novel around it using AI models.

---

##  Key Features

### 1. Interactive DAG Editor
- **Drag-and-Drop Canvas**: Drag structural nodes (`Entry`, `Spine`, `Terminus`), logic gates (`Convergence AND`, `Disjunction OR`, `Constraint`, `Elimination`), and narrative triggers (`Decoy`, `False Resolution`, `Red Herring`, `Observation`) onto an infinite grid.
- **Flexible Path Routing**: Connect ports with bezier curves representing prerequisites, contradictions, eliminations, or recontextualisations.
- **Topological Diagnostics**: A background validation thread continuously checks the graph structure for cycle violations, unreachable nodes, orphan dead ends, or illegal gates.
- **Visual Fact Badges**: Once facts are allocated to the graph, yellow badges dynamically overlay on the SVG canvas showing exactly how many clues are discovered at each node.

### 2. Built-in Server Project Database
- Includes a backend project database. You can save, load, and delete projects directly from the Node.js server.
- Comes pre-packaged with a complete sample project: **New Haven Mansion Murder** (Harrison Green mystery), containing a pre-drawn graph and fully generated story layers.

### 3. Resilient Key-Rotation API Client
- The server runs an automatic fallback rotation across **7 pre-coded Groq API keys** to handle rate limits (`HTTP 429`) seamlessly.
- Provides support for a custom Groq API key override.
- Live-monitoring console terminal outputs timings, key rotations, model metrics, and speed in real time.

---

##  The 7-Layer Mystery Generation Architecture

The core of this project is the **Sequential Generation Pipeline**. Rather than generating a story in a single prompt (which leads to logical errors, forgotten clues, and plot holes), the engine breaks the mystery down into **7 distinct semantic layers**. Each layer acts as a strict compile-time constraint on the next.

```
+-------------------------------------------------------+
|  Layer 1: Visual Topology (The Logical Graph)         |
+---------------------------+---------------------------+
                            |
                            v
+-------------------------------------------------------+
|  Layer 2: Logical Contracts (Obligations per Node)    |
+---------------------------+---------------------------+
                            |
                            v
+-------------------------------------------------------+
|  Layer 3: Premise Seed (Genre, Tone, setting, Cast)   |
+---------------------------+---------------------------+
                            |
                            v
+-------------------------------------------------------+
|  Layer 3.5: Truth Ledger (World Bible & Guilt Proof)  |
+---------------------------+---------------------------+
                            |
                            v
+-------------------------------------------------------+
|  Layer 4: Knowledge Ledger (Actor Timelines & Secrets)|
+---------------------------+---------------------------+
                            |
                            v
+-------------------------------------------------------+
|  Layer 4.5: Evidence Ledger (Observable Clues Catalog)|
+---------------------------+---------------------------+
                            |
                            v
+-------------------------------------------------------+
|  Layer 5: Allocation Ledger (Chronological Discovery) |
+---------------------------+---------------------------+
                            |
                            v
+-------------------------------------------------------+
|  Layer 6: Serial Prose Generation (Node-by-Node text) |
+---------------------------+---------------------------+
                            |
                            v
+-------------------------------------------------------+
|  Layer 7: Consistency Verification (Auditing)        |
+-------------------------------------------------------+
```

---

### Detailed Layer Walkthrough

####  Layer 1 — Topology
The visual wiring diagram of the mystery. It represents the abstract shape of the deduction—how clues flow and converge toward the final truth.
* **Nodes**: Represent milestones of discovery.
* **Edges**: Represent logical dependencies (e.g., A must be known before B can be deduced). Ignored backward edges (typed as `recontext`) prevent cyclic dependency errors during sorting.
* **Dials**: Four global configuration dials specify graph gating metrics (e.g., how the main solution is coupled to decoy streams).

####  Layer 2 — Logical Contracts
The compiler reads the Layer 1 graph structure and derives a strict list of logical obligations for each node.
* **Receives**: What information must be established before this node can trigger.
* **Produces**: What specific facts or revelations this node is obligated to output.
* **Forbidden to Reveal**: Information this node is strictly prohibited from leaking (e.g., the killer's name cannot be revealed in the first scene).
* **Delegated Guarantees**: Logical constraints that this node requires but cannot verify itself, passing the verification obligation downstream.

####  Layer 3 — Premise Seed
The only layer where free creative invention is permitted. The engine takes your selected **Genre** (e.g., Cozy Whodunit, Sci-Fi) and **Tone** (e.g., Dark & Analytical) and generates a single paragraph defining:
* The victim's identity and setting.
* The murder scenario (e.g., locked room).
* A cast of 6 suspects ($S_1$ through $S_6$).

####  Layer 3.5 — Truth Ledger
Constructs the objective reality of the mystery world based on the Premise and Contracts. It acts as the "World Bible":
* **Profiles**: Assigns roles to suspects (S6 is the true killer, S5 is the false resolution candidate, S1 is the red herring).
* **Locations**: Catalogs room and environmental layouts.
* **Estate Assets**: Lists files, accounts, and wills ($D_1, D_2, A_1$).
* **Guilt Intersection Proof**: Enforces the mathematical constraint that the true killer is the unique element at the intersection of two distinct property dimensions:
  $$P_{financial} \cap P_{digital} = \{S_6\}$$
  The ledger compiles explicit proofs showing that S6 is the only character who possessed both the financial motive and the digital access to execute the crime.

####  Layer 4 — Knowledge Ledger
Maps the characters' internal minds. For each timeline stage (e.g., Pre-murder, Investigation, Confrontation), it tracks:
* What facts each actor currently knows.
* The source of their knowledge (observations, rumors, documents).
* Whether a fact is **suppressed** (withheld as a secret).
* This ledger ensures characters do not act on information they have not yet discovered.

####  Layer 4.5 — Evidence Ledger
Maps the physical residues left in the environment. Every character action in the Knowledge Ledger generates physical evidence:
* **Traces**: Incriminating objects, logs, footprints, letters ($E_1$ to $E_8$).
* **Causal Reference**: Links each clue to the specific character knowledge state that caused them to leave that trace.

####  Layer 5 — Fact Allocation Ledger
Distributes all facts and clues to specific graph nodes in chronological discovery order.
* **Discovery Ordering**: Ensures that clues pointing to the false suspect ($S_5$) are revealed early (leading to a false resolution), and the invalidating clue (pointing to $S_6$) is withheld until later, satisfying the topology's gating requirements.

####  Layer 6 — Serial Prose Generation
The serial novel is compiled node-by-node in topological dependency order.
* **Context Preservation**: The prompt for each node is fed all *upstream* prose blocks written so far. This forces the LLM to follow the exact established chronology.
* **Visual Integration**: During generation, the editor highlights the node being processed on the SVG canvas, centering the viewport on it so you can see the narrative form visually.
* **Single Node Regeneration**: You can click **Regen** on any prose block to rewrite that specific chapter without corrupting the rest of the story.

####  Layer 7 — Consistency Verification
A developmental editor sweep. The engine analyzes the completed text against all previous ledgers, verifying:
* **Fairness**: Was all allocated evidence actually mentioned in the prose?
* **Contracts**: Did every scene respect its logical contracts?
* **No Contradictions**: Are character actions and timelines logically consistent?
* Reports a detailed auditing list with `PASS`/`FAIL` markers for each check.

---

##  Repository Structure

```
.
├── package.json               # Root scripts to install and run the app
├── layern.json                # Reference schema (Fact Allocation Ledger)
├── layern2.json               # Reference schema (Truth Ledger)
├── backend/
│   ├── package.json           # Backend API dependencies
│   ├── server.js              # Express routing, key rotation, database controller
│   ├── prompts.js             # Modular prompt compilation templates
│   └── projects/              # Local database folder for project JSONs
│       └── new_haven_mansion_murder.json  # Pre-generated Harrison Green sample mystery
└── frontend/
    ├── index.html             # UI HTML markup layout
    ├── css/
    │   └── style.css          # Cyber stylesheet, custom selects, tab layouts, and terminal
    └── js/
        ├── editor.js          # SVG diagram core canvas events, pan, zoom, and inspector
        └── generator.js       # Generation state client coordinator
```

---

##  Setup & Running Instructions

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed (version 18+ recommended, as it features native `fetch` support).

### Quick Start

1. **Install all dependencies** from the project root directory:
   - On Windows (PowerShell):
     ```powershell
     npm.cmd run install-all
     ```
   - On Mac/Linux/CMD:
     ```bash
     npm run install-all
     ```

2. **Start the application**:
   - On Windows (PowerShell):
     ```powershell
     npm.cmd start
     ```
   - On Mac/Linux/CMD:
     ```bash
     npm start
     ```

3. **Launch in Browser**:
   Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

### Running the Sample Project
1. Open the app in your browser.
2. Click **Load** in the top-right corner.
3. Select **new_haven_mansion_murder** from the list of server projects.
4. Go to the **Generator** tab in the right sidebar.
5. Click through the timeline steps (L2 to L7) to see the generated story layers, edit the JSON structures, or regenerate prose blocks!
