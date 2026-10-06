import { defineCard } from "../define.js";

const SAPROLING_TEXT = "{1}{G}, Exile a creature card from your graveyard: Create a 1/1 green Saproling creature token.";
const SAC_TEXT = "Sacrifice two Saprolings: You gain 2 life and draw a card.";

export default defineCard({
  name: "Fungal Plots",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["enchantment"],
  text: `${SAPROLING_TEXT}\n${SAC_TEXT}`,
  activated: [
    {
      cost: { mana: "{1}{G}", tap: false, exileFromGraveyard: { count: 1, filter: { type: "creature" } } },
      targets: [],
      effect: { kind: "create-token", token: "Saproling Token", count: 1 },
      resolve: null,
      text: SAPROLING_TEXT,
    },
    {
      // Any two Saprolings you control — the cost names a subtype, not a type.
      cost: { mana: null, tap: false, sacrifice: { filter: { subtype: "Saproling" }, count: 2 } },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "gain-life", amount: 2 },
          { kind: "draw", amount: 1 },
        ],
      },
      resolve: null,
      text: SAC_TEXT,
    },
  ],
});
