import { defineCard } from "../define.js";

// EDHREC rank 3583.
//
// Rulings:
//   [2018-01-19] The number of Vampires you control is counted only as Champion of Dusk's ability
//     resolves. If Champion of Dusk is still on the battlefield, it'll count itself.

const ETB_TEXT =
  "When this creature enters, you draw X cards and you lose X life, where X is the number of Vampires you control.";
const VAMPIRES = { countOf: { subtype: "Vampire", controlledBy: "you" } } as const;

export default defineCard({
  name: "Champion of Dusk",
  manaCost: "{3}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Vampire", "Knight"],
  power: 4,
  toughness: 4,
  text: ETB_TEXT,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      // Be'lakor, the Dark Master's shape.
      effect: {
        kind: "sequence",
        effects: [
          { kind: "draw", amount: VAMPIRES },
          { kind: "lose-life", amount: VAMPIRES },
        ],
      },
      resolve: null,
      text: ETB_TEXT,
    },
  ],
});
