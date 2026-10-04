import { defineCard } from "../define.js";

// Goblin Spymaster's 1/1 red Goblin: every creature its controller controls,
// itself included, attacks each combat if able (rule 508.1d — never at a cost).
const TEXT = "Creatures you control attack each combat if able.";

export default defineCard({
  name: "Goblin Token (Goblin Spymaster)",
  art: "1db51576-a755-45de-b37b-f16b27e8f3a1",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Goblin"],
  power: 1,
  toughness: 1,
  text: TEXT,
  static: [
    {
      affects: { scope: "filter", filter: { type: "creature", controlledBy: "you" } },
      restrictions: ["must-attack"],
      text: TEXT,
    },
  ],
});
