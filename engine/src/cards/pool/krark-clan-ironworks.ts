import { defineCard } from "../define.js";

export default defineCard({
  name: "Krark-Clan Ironworks",
  manaCost: "{4}",
  colors: [],
  types: ["artifact"],
  text: "Sacrifice an artifact: Add {C}{C}.",
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: { filter: { type: "artifact" } } },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 2 },
      resolve: null,
      text: "Sacrifice an artifact: Add {C}{C}.",
    },
  ],
});
