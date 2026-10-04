import { defineCard } from "../define.js";

// EDHREC rank 3741.
//
// Spell Swindle's shape: "that spell's mana value" is read as the spell last
// existed on the stack (its X counts), and a spell that can't be countered
// still makes the Thopters.
export default defineCard({
  name: "Access Denied",
  manaCost: "{3}{U}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Counter target spell. Create X 1/1 colorless Thopter artifact creature tokens with flying, where X is that spell's mana value.",
  targets: ["spell"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "counter", target: 0 },
      { kind: "create-token", token: "Thopter Token", count: { manaValueOf: 0 } },
    ],
  },
});
