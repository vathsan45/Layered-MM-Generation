// Prompt templates for sequential mystery generation (Layers 2 to 7)

function makeLayer2Prompt(graph) {
  return `
You are an expert narrative architect. You are analyzing a deduction topology graph designed for a murder mystery.
Your task is to generate Layer 2: Contracts.
Read the following topology JSON and derive what each node is obligated to do.
For every node:
1. What it must receive (prerequisites, inputs).
2. What it must produce/reveal (outputs, findings).
3. What it is forbidden to say (information that must remain hidden until downstream).
4. Structural guarantees delegated downstream (any constraints this node requires but cannot verify itself).

Topology Graph:
${JSON.stringify(graph, null, 2)}

Respond with a raw JSON object (and absolutely nothing else) in the following format:
{
  "nodes": {
    "node_id": {
      "receives": ["string description of what it receives"],
      "produces": ["string description of what it reveals/produces"],
      "forbidden_to_reveal": ["string description of what it must NOT reveal"],
      "delegated_guarantees": ["string description of downstream validations delegated"]
    }
  }
}
`;
}

function makeLayer3Prompt(genre, tone, contracts, setting) {
  const settingInstruction = setting === 'indian'
    ? `
CRITICAL INSTRUCTION: Generate the Indian Version of the story. 
- All characters (V1, suspects S1-S6) MUST have authentic Indian names (e.g. Inspector Wilson could become Inspector Vikram, Evelyn Stone could become Priya, Victor LaGraine could become Varun, etc.).
- The setting MUST be an Indian location suited to the genre (e.g. a monsoon-drenched heritage estate in Alibaug, a misty tea garden bungalow in Ooty, a high-tech corporate lab in Bangalore, a vintage fort-haveli in Rajasthan, or a crowded precinct in Mumbai).
- The currency, assets, cultural references (like chai, regional foods, and family hierarchies) must reflect Indian life.
`
    : `
CRITICAL INSTRUCTION: Generate the International Version of the story.
- All characters (V1, suspects S1-S6) must have Western/international names (e.g., Harrison Green, Victor LaGraine).
- The setting must be an international Western city or locale (e.g., New Haven, London, Neo-Tokyo, Paris).
`;

  return `
You are an expert creative writer. Write a short, highly compelling creative premise seed for a murder mystery.
This premise must fit:
Genre: ${genre}
Thematic Tone: ${tone}

${settingInstruction}

Use the logical node contracts as constraints on how the mystery unfolds:
Node Contracts:
${JSON.stringify(contracts, null, 2)}

Write exactly one paragraph of unconstrained creative input. Define:
1. The victim's name, role, and the setting.
2. The murder scenario (method, locked room or impossible circumstance if applicable).
3. The cast scope (briefly list the suspects S1 through S6, their names and roles).
4. The thematic atmosphere.

Respond with a raw JSON object (and absolutely nothing else) in this format:
{
  "premise": "The single paragraph of creative text."
}
`;
}

function makeLayer3_5Prompt(graph, premise, contracts, setting) {
  const settingInstruction = setting === 'indian'
    ? `
CRITICAL INSTRUCTION: Maintain the Indian Version of the story from the Premise.
- Suspect names, locations, and assets MUST match the Indian names and setting introduced in the Premise.
- Assets must reflect the setting (e.g., Haveli, heritage assets, cash in Rupees (INR), gold jewelry, digital locker, etc.).
- Ensure all locations and relationships are culturally coherent.
`
    : `
CRITICAL INSTRUCTION: Maintain the International Version of the story. Suspect names, locations, and assets must be Western/international as introduced in the Premise (e.g. Harrison Green, dollars, private estate).
`;

  return `
You are a master detective narrative planner. You will generate Layer 3.5: Truth Ledger.
Construct the objective reality of the mystery world based on the Premise and the Node Contracts.

Premise:
${premise}

Topology & Contracts:
${JSON.stringify(contracts, null, 2)}

${settingInstruction}

Requirements for the output JSON:
1. "locations": Map locations (like L1: estate, L2: private study, etc.).
2. "victim": Define the victim's profile (name, role, assets like D1: will, D2: codicil, A1: archive, F1: bank account).
3. "suspects": Define 6 suspects (S1 to S6) with names, roles, relationships. One MUST be the true killer (e.g. S6), one a false resolution candidate (e.g. S5), and one a red herring (e.g. S1).
4. "estate_assets": Asset list with types.
5. "relationship_truths": Hidden truths (like R1, R2, R3).
6. "candidate_properties": Two dimensions of access properties (e.g. P_financial, P_digital) and which suspects possess them.
7. "branch_allocations": Connect branch flows to these properties.
8. "red_herring_contract": Motive and properties of the red herring.
9. "false_resolution_contract": How the false candidate is set up and why it fails (logical contradiction).
10. "true_solution_framework": The true killer, trigger event, and motive.
11. "locked_room_invariant": Logical explanation compatible with locked room.
12. "topology_proofs": Verification proofs demonstrating the "intersection uniqueness" constraint (P_financial intersect P_digital = {S6}).

Respond with a raw JSON object (and absolutely nothing else) matching the format:
{
  "world_bible": {
    "locations": {
      "L1": { "name": "...", "type": "estate", "properties": ["..."] }
    },
    "victim": { "id": "V1", "name": "...", "role": "victim", "occupation": "...", "owner_of": ["D1", "D2"] },
    "suspects": [
      { "id": "S1", "name": "...", "role": "...", "relationship": "...", "herring_candidate": true },
      { "id": "S5", "name": "...", "role": "...", "relationship": "...", "false_resolution_candidate": true },
      { "id": "S6", "name": "...", "role": "...", "relationship": "...", "true_killer": true }
    ]
  },
  "estate_assets": { ... },
  "relationship_truths": { ... },
  "candidate_properties": { ... },
  "branch_allocations": { ... },
  "red_herring_contract": { ... },
  "false_resolution_contract": { ... },
  "true_solution_framework": { ... },
  "locked_room_invariant": { ... },
  "topology_proofs": {
    "GG1": {
      "description": "unique_intersection",
      "P_financial": ["S1", "S5", "S6"],
      "P_digital": ["S6"],
      "intersection": ["S6"],
      "cardinality": 1,
      "status": "PASS"
    }
  }
}
`;
}

function makeLayer4Prompt(truthLedger) {
  return `
You are analyzing the Truth Ledger of a murder mystery.
Your task is to generate Layer 4: Knowledge Ledger.
Track who knows each truth from the Truth Ledger, when they learned it, and how.
Every actor in the mystery (killer, victim, suspects, witnesses, detective) gets a knowledge state that evolves over time.
Identify any suppressed knowledge (secrets characters withhold).

Truth Ledger:
${JSON.stringify(truthLedger, null, 2)}

Respond with a raw JSON object in the following format:
{
  "timeline_stages": ["stage1", "stage2"],
  "actors": {
    "actor_id_or_name": {
      "timeline": [
        {
          "stage": "stage_id",
          "known_truths": ["truth_id_or_statement"],
          "source": "how they learned it",
          "suppressed": true
        }
      ]
    }
  }
}
`;
}

function makeLayer4_5Prompt(truthLedger, knowledgeLedger) {
  return `
You are generating Layer 4.5: Evidence Ledger.
Derive what physical and observable traces exist in the mystery world because characters acted on their knowledge.
Every clue, record, transaction log, letter, footprint, or suspicious behavior originates here.
Each trace must have a causal link to the knowledge state that caused the action.

Truth Ledger:
${JSON.stringify(truthLedger, null, 2)}

Knowledge Ledger:
${JSON.stringify(knowledgeLedger, null, 2)}

Respond with a raw JSON object in the following format:
{
  "evidence_traces": {
    "E1": {
      "name": "clue/trace name",
      "description": "what the trace is",
      "location": "L1 or L2",
      "causal_knowledge_ref": "actor knew X and did Y",
      "associated_entities": ["S1", "D2"]
    }
  }
}
`;
}

function makeLayer5Prompt(graph, truthLedger, evidenceLedger) {
  return `
You are generating Layer 5: Allocation Ledger.
Assign each piece of evidence/truth/fact from previous ledgers to a specific node in the topology graph.
Decide when the reader discovers it, what is emphasized, and what is withheld.
Ensure the false resolution evidence is allocated early and the invalidating evidence is allocated later (after false resolution fires).

Topology Graph:
${JSON.stringify(graph, null, 2)}

Truths & Evidence Traces:
${JSON.stringify(truthLedger, null, 2)}
${JSON.stringify(evidenceLedger, null, 2)}

Respond with a raw JSON object matching the format of layern.json. Example:
{
  "facts": {
    "F1": {
      "statement": "Adrian Blackthorn is dead.",
      "entity_refs": ["V1"],
      "first_visible_at": "n1",
      "visibility": "explicit",
      "importance": "critical"
    }
  },
  "node_allocations": {
    "n1": ["F1"],
    "n2": ["F2", "F3"]
  }
}
`;
}

function makeLayer6Prompt(nodeId, nodeLabel, nodeType, contract, worldBible, allocatedFacts, upstreamProse, genre, tone, setting) {
  const settingInstruction = setting === 'indian'
    ? `
CRITICAL INSTRUCTION: Write the prose in the Indian Version style.
- Maintain the Indian character names, Indian location details, and cultural textures (e.g. sound of traffic/monsoon rain, references to local places, smells of spices or tea, local cultural idioms, etc.).
- Reflect this setting in the prose's metaphors and descriptions.
`
    : `
CRITICAL INSTRUCTION: Write the prose in the Western/International style.
- Maintain Western names and setting details.
`;

  return `
You are a novelist writing a murder mystery chapter/scene.
You are writing the prose block for a specific node in the deduction topology.
Node: ${nodeId} (${nodeLabel}, type: ${nodeType})

Mystery Setting & Cast:
${JSON.stringify(worldBible, null, 2)}

Node Contract:
${JSON.stringify(contract, null, 2)}

Allocated Facts that must be revealed or emphasized in this node:
${JSON.stringify(allocatedFacts, null, 2)}

Upstream Prose blocks generated so far (respect this chronology, do NOT contradict this content):
${upstreamProse}

${settingInstruction}

Constraints:
1. No new entities can be invented here.
2. No content can reference downstream facts or nodes.
3. Write 1-2 paragraphs of highly atmospheric narrative prose fitting the ${genre} genre and ${tone} tone. The detective or characters are discovering/analyzing the facts allocated to this node.

Respond with a raw JSON object:
{
  "prose": "The generated prose text."
}
`;
}

function makeLayer7Prompt(storyProse, contracts, worldBible, knowledgeLedger, allocationLedger) {
  return `
You are a developmental editor and logical validator. You are running a backward sweep across all generated prose blocks in a murder mystery.
Check them against all previous layers.
1. Topology compliance: Did each node honor its contract (receives, produces, forbidden)?
2. Knowledge consistency: Did the prose respect who knows what, when?
3. Clue fairness: Was all allocated evidence actually generated?
4. Uniqueness: Does the story actually narrow down to exactly one candidate?
5. Branch usefulness: Are both deduction branches referenced in the final resolution?
6. Contradictions: Are there any factual contradictions?

Prose Blocks:
${JSON.stringify(storyProse, null, 2)}

Previous Ledgers:
Contracts: ${JSON.stringify(contracts, null, 2)}
World Bible: ${JSON.stringify(worldBible, null, 2)}
Knowledge Ledger: ${JSON.stringify(knowledgeLedger, null, 2)}
Allocation Ledger: ${JSON.stringify(allocationLedger, null, 2)}

Respond with a raw JSON object in the following format:
{
  "pass": true,
  "checks": [
    {
      "name": "check name",
      "status": "PASS",
      "comments": "explanation of check results",
      "failure_origin_layer": null
    }
  ]
}
`;
}

module.exports = {
  makeLayer2Prompt,
  makeLayer3Prompt,
  makeLayer3_5Prompt,
  makeLayer4Prompt,
  makeLayer4_5Prompt,
  makeLayer5Prompt,
  makeLayer6Prompt,
  makeLayer7Prompt
};
