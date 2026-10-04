import { defineCard } from "../define.js";

// EDHREC rank 2919.
// The Swamp ability is a triggered mana ability (rule 605.1b), as Crypt Ghast's.
const MANA_TEXT = "Whenever you tap a Swamp for mana, add an additional {B}.";

export default defineCard({
  name: "Nirkana Revenant",
  manaCost: "{4}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Vampire", "Shade"],
  power: 4,
  toughness: 4,
  text: `${MANA_TEXT}\n{B}: This creature gets +1/+1 until end of turn.`,
  triggered: [
    {
      trigger: { on: "tapped-for-mana", who: "you-control", filter: { subtype: "Swamp" } },
      targets: [],
      effect: { kind: "add-mana", mana: "B", amount: 1 },
      resolve: null,
      text: MANA_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{B}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: 1, duration: "end-of-turn" },
      resolve: null,
      text: "{B}: This creature gets +1/+1 until end of turn.",
    },
  ],
});
