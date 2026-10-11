import { defineCard } from "../define.js";

const MANA_TEXT = "{T}: Add {G}, {U}, or {R}.";
const FACE_UP_TEXT = "When this creature is turned face up, add {G}{U}{R}.";

// Morph {2} (rule 702.37). The face-up trigger uses the stack — it isn't a
// mana ability (rule 605.1b), so it adds its mana as it resolves.
export default defineCard({
  name: "Rattleclaw Mystic",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Human", "Shaman"],
  power: 2,
  toughness: 1,
  text: `${MANA_TEXT}\nMorph {2}\n${FACE_UP_TEXT}`,
  morph: { keyword: "morph", cost: "{2}" },
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["G", "U", "R"] }, amount: 1 },
      resolve: null,
      text: MANA_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "turned-face-up", who: "self" },
      targets: [],
      effect: { kind: "add-mana", mana: { all: ["G", "U", "R"] }, amount: 1 },
      resolve: null,
      text: FACE_UP_TEXT,
    },
  ],
});
