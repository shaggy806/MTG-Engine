import { defineCard } from "../define.js";

// "Add {B} or {G} for each": each unit either colour, the split the
// player's as the spell resolves (the ruling: not limited to one colour) —
// `add-mana` asks, off the stack. Only what was actually destroyed counts
// (an indestructible or regenerated permanent wasn't), every token of a
// stack included.
export default defineCard({
  name: "Culling Ritual",
  manaCost: "{2}{B}{G}",
  colors: ["B", "G"],
  types: ["sorcery"],
  text: "Destroy each nonland permanent with mana value 2 or less. Add {B} or {G} for each permanent destroyed this way.",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "destroy-all", filter: { notTypes: ["land"], manaValue: { op: "lte", n: 2 } } },
      { kind: "add-mana", mana: { oneOf: ["B", "G"] }, amount: { thisWay: "destroyed" } },
    ],
  },
});
