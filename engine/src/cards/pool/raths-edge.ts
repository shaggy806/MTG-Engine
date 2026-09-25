import { defineCard } from "../define.js";

export default defineCard({
  name: "Rath's Edge",
  colors: [],
  supertypes: ["legendary"],
  types: ["land"],
  text: "{T}: Add {C}.\n{4}, {T}, Sacrifice a land: Rath's Edge deals 1 damage to any target.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: "{4}", tap: true, sacrifice: { filter: { type: "land" } } },
      targets: ["any-target"],
      effect: { kind: "damage", amount: 1, target: 0 },
      resolve: null,
      text: "{4}, {T}, Sacrifice a land: Rath's Edge deals 1 damage to any target.",
    },
  ],
});
