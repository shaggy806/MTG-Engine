import { defineCard } from "../define.js";

// EDHREC rank 6483.
//
// Rulings:
//   [2023-10-13] Five Hundred Year Diary counts itself for its second ability.
//
// A Clue without the Clue token's ability: its own {2} ability is printed.
// The mana ability counts as it resolves (Priest of Titania's shape).
const TAPPED_TEXT = "Five Hundred Year Diary enters tapped.";
const MANA_TEXT = "{T}: Add {U} for each Clue you control.";
const DRAW_TEXT = "{2}, Sacrifice Five Hundred Year Diary: Draw a card.";

export default defineCard({
  name: "Five Hundred Year Diary",
  manaCost: "{3}{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["artifact"],
  subtypes: ["Book", "Clue"],
  text: `${TAPPED_TEXT}\n${MANA_TEXT}\n${DRAW_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: TAPPED_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "U", amount: { countOf: { subtype: "Clue", controlledBy: "you" } } },
      resolve: null,
      text: MANA_TEXT,
    },
    {
      cost: { mana: "{2}", tap: false, sacrifice: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
});
