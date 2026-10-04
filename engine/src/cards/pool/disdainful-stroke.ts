import { defineCard } from "../define.js";

// Rulings: a spell's chosen {X} counts toward its mana value on the stack
// (rule 202.3e — the `spell` target filter reads it that way); a face-down
// spell has mana value 0, so it can't be targeted.
export default defineCard({
  name: "Disdainful Stroke",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Counter target spell with mana value 4 or greater.",
  targets: [{ kind: "spell", filter: { manaValue: { op: "gte", n: 4 } } }],
  effect: { kind: "counter", target: 0 },
});
