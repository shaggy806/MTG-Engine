import { defineCard } from "../define.js";

// EDHREC rank 6702. Wirewood Channeler's shape: "X mana of any one color" is
// `any-color` × X, never a mix. X counts the Allies you control, this one
// included, as the mana ability resolves — it's a mana ability, so nothing
// can respond to it (its ruling).
const TEXT = "{T}: Add X mana of any one color, where X is the number of Allies you control.";

export default defineCard({
  name: "Harabaz Druid",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Human", "Druid", "Ally"],
  power: 0,
  toughness: 1,
  text: TEXT,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: { countOf: { subtype: "Ally", controlledBy: "you" } } },
      resolve: null,
      text: TEXT,
    },
  ],
});
