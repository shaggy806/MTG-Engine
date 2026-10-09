import { defineCard } from "../define.js";

// Tramplesaurus Rex. A blocking restriction (rule 509.1b), checked as blocks
// are declared (`blockedByAtMostOne`), so "power 4 or greater" is each
// creature's power then. The Troll itself is a 6/5.
const TEXT = "Each creature you control with power 4 or greater can't be blocked by more than one creature.";

export default defineCard({
  name: "Challenger Troll",
  manaCost: "{4}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Troll"],
  power: 6,
  toughness: 5,
  text: TEXT,
  static: [
    {
      affects: { scope: "filter", filter: { type: "creature", controlledBy: "you", power: { op: "gte", n: 4 } } },
      blockedByAtMostOne: true,
      text: TEXT,
    },
  ],
});
