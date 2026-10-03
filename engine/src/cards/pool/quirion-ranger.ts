import { defineCard } from "../define.js";

// Any land with the subtype Forest pays the cost, not only one named Forest,
// and the target may be any creature, tapped or not (the rulings). Returning
// the Forest is the cost, paid as the ability is activated, so nobody can
// answer by removing it first (the ruling).
const TEXT = "Return a Forest you control to its owner's hand: Untap target creature. Activate only once each turn.";

export default defineCard({
  name: "Quirion Ranger",
  manaCost: "{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Ranger"],
  power: 1,
  toughness: 1,
  text: TEXT,
  activated: [
    {
      cost: { mana: null, tap: false, returnToHand: { count: 1, filter: { subtype: "Forest" } } },
      targets: ["creature"],
      effect: { kind: "untap", target: 0 },
      resolve: null,
      text: TEXT,
      oncePerTurn: true,
    },
  ],
});
