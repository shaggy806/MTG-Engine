import { defineCard } from "../define.js";

// EDHREC rank 3363.

const SMEAR_TEXT =
  "Smear Campaign — {1}, {T}: Target legendary creature gains menace until end of turn. Activate only as a sorcery.";

export default defineCard({
  name: "Daily Bugle Building",
  colors: [],
  types: ["land"],
  text: `{T}: Add {C}.\n{1}, {T}: Add one mana of any color.\n${SMEAR_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: "{1}", tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      text: "{1}, {T}: Add one mana of any color.",
    },
    {
      cost: { mana: "{1}", tap: true },
      targets: [{ kind: "permanent", filter: { type: "creature", supertype: "legendary" } }],
      effect: { kind: "grant-keyword", target: 0, keyword: "menace", duration: "end-of-turn" },
      resolve: null,
      text: SMEAR_TEXT,
      sorcerySpeed: true,
    },
  ],
});
