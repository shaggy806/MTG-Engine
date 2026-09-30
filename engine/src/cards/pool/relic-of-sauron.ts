import { defineCard } from "../define.js";

const MANA_TEXT = "{T}: Add two mana in any combination of {U}, {B}, and/or {R}.";
const LOOT_TEXT = "{3}, {T}: Draw two cards, then discard a card.";

export default defineCard({
  name: "Relic of Sauron",
  manaCost: "{4}",
  types: ["artifact"],
  text: `${MANA_TEXT}\n${LOOT_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["U", "B", "R"] }, amount: 2 },
      resolve: null,
      text: MANA_TEXT,
    },
    {
      cost: { mana: "{3}", tap: true },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [{ kind: "draw", amount: 2 }, { kind: "discard", target: "you", amount: 1 }],
      },
      resolve: null,
      text: LOOT_TEXT,
    },
  ],
});
