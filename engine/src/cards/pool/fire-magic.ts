import { defineCard } from "../define.js";

// EDHREC rank 3794. Tiered (rule 702.183a) is spree's machinery with exactly
// one mode — Thunder Magic's shape.
const FIRE = "• Fire — {0} — Fire Magic deals 1 damage to each creature.";
const FIRA = "• Fira — {2} — Fire Magic deals 2 damage to each creature.";
const FIRAGA = "• Firaga — {5} — Fire Magic deals 3 damage to each creature.";

export default defineCard({
  name: "Fire Magic",
  manaCost: "{R}",
  colors: ["R"],
  types: ["instant"],
  text: `Tiered (Choose one additional cost.)\n${FIRE}\n${FIRA}\n${FIRAGA}`,
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      { text: FIRE, spreeCost: "{0}", targets: [], effect: { kind: "damage-all", filter: { type: "creature" }, amount: 1 } },
      { text: FIRA, spreeCost: "{2}", targets: [], effect: { kind: "damage-all", filter: { type: "creature" }, amount: 2 } },
      { text: FIRAGA, spreeCost: "{5}", targets: [], effect: { kind: "damage-all", filter: { type: "creature" }, amount: 3 } },
    ],
  },
});
