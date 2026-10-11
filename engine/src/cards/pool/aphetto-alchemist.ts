import { defineCard } from "../define.js";

const UNTAP_TEXT = "{T}: Untap target artifact or creature.";

// Morph (rule 702.37): cast face down as a 2/2 for {3}, turned face up any
// time for {U}. Face down, it has no abilities (708.2a).
export default defineCard({
  name: "Aphetto Alchemist",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 1,
  toughness: 2,
  text: `${UNTAP_TEXT}\nMorph {U}`,
  morph: { keyword: "morph", cost: "{U}" },
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: ["artifact-or-creature"],
      effect: { kind: "untap", target: 0 },
      resolve: null,
      text: UNTAP_TEXT,
    },
  ],
});
