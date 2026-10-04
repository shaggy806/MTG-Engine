import { defineCard } from "../define.js";

// EDHREC rank 3209.
// Makes Treasure → "Treasure Token".
//
// Rulings:
//   [2017-09-29] You may target a spell that can't be countered. When Spell Swindle resolves, the
//     target spell will be unaffected, but you'll still get Treasures.
//   [2017-09-29] For spells with {X} in their mana costs, use the value chosen for X to determine
//     the spell's mana value.
//
// Mana Drain's shape: "that spell's mana value" is read as the spell last
// existed on the stack, its chosen X included (rule 202.3e), and a spell that
// can't be countered still pays out.
export default defineCard({
  name: "Spell Swindle",
  manaCost: "{3}{U}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Counter target spell. Create X Treasure tokens, where X is that spell's mana value. (They're artifacts with \"{T}, Sacrifice this token: Add one mana of any color.\")",
  targets: ["spell"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "counter", target: 0 },
      { kind: "create-token", token: "Treasure Token", count: { manaValueOf: 0 } },
    ],
  },
});
