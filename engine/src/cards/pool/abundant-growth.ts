import { addManaAbility } from "../helpers.js";
import { defineCard } from "../define.js";

// EDHREC rank 2428.
//
// Karametra's Favor's shape on a land: the granted mana ability is in
// addition to the land's own (its ruling).
const DRAW_TEXT = "When this Aura enters, draw a card.";
const GRANT_TEXT = 'Enchanted land has "{T}: Add one mana of any color."';

export default defineCard({
  name: "Abundant Growth",
  manaCost: "{G}",
  colors: ["G"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: `Enchant land\n${DRAW_TEXT}\n${GRANT_TEXT}`,
  targets: ["land"],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
  static: [
    {
      affects: { scope: "attached" },
      grantsActivated: [addManaAbility({ mana: "any-color", text: "{T}: Add one mana of any color." })],
      text: GRANT_TEXT,
    },
  ],
});
