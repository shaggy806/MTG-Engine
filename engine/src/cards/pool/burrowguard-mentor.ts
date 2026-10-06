import { defineCard } from "../define.js";

// EDHREC rank 6657.
//
// Rulings:
//   [2024-07-26] The ability that defines Burrowguard Mentor's power and toughness functions in
//     all zones, not just the battlefield.

const PT_TEXT = "Burrowguard Mentor's power and toughness are each equal to the number of creatures you control.";

export default defineCard({
  name: "Burrowguard Mentor",
  manaCost: "{G}{W}",
  colors: ["W", "G"],
  types: ["creature"],
  subtypes: ["Rabbit", "Soldier"],
  power: 0,
  toughness: 0,
  keywords: ["trample"],
  text: `Trample\n${PT_TEXT}`,
  static: [
    {
      // A characteristic-defining ability (rule 604.3), counting itself —
      // Silverwing Squadron's shape.
      affects: { scope: "self" },
      setBasePtFromCount: {
        countOf: { countOf: { type: "creature", controlledBy: "you" } },
        plusPower: 0,
        plusToughness: 0,
      },
      text: PT_TEXT,
    },
  ],
});
