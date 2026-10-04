import { defineCard } from "../define.js";

// EDHREC rank 6101.
//
// Rulings:
//   [2026-01-27] Mona Lisa's last ability is a mana ability. It doesn't use the stack and can't be
//     responded to.

const MANA_TEXT = "{T}: Add X mana of any one color, where X is Mona Lisa's power.";

export default defineCard({
  name: "Mona Lisa, Science Geek",
  manaCost: "{2}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Lizard", "Mutant"],
  power: 1,
  toughness: 3,
  keywords: ["reach"],
  text: `Reach\n${MANA_TEXT}`,
  activated: [
    {
      // Heronblade Elite's shape: "any-color" with an amount is that much of
      // one colour, its power read as the ability is activated.
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: { powerOf: "source" } },
      resolve: null,
      text: MANA_TEXT,
    },
  ],
});
