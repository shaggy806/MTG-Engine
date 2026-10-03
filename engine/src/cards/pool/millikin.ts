import { defineCard } from "../define.js";

const MANA_TEXT =
  "{T}, Mill a card: Add {C}. (Activate only as an instant. To mill a card, put the top card of your library into your graveyard.)";

// Not a mana ability (its ruling; rule 605.1a — the cost moves a card from a
// library), so it goes on the stack and the {C} arrives as it resolves.
export default defineCard({
  name: "Millikin",
  manaCost: "{2}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Construct"],
  power: 0,
  toughness: 1,
  text: MANA_TEXT,
  activated: [
    {
      cost: { mana: null, tap: true, mill: 1 },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: MANA_TEXT,
    },
  ],
});
