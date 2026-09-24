import { defineCard } from "../define.js";

export default defineCard({
  name: "Access Tunnel",
  colors: [],
  types: ["land"],
  text: "{T}: Add {C}.\n{3}, {T}: Target creature with power 3 or less can't be blocked this turn.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: "{3}", tap: true },
      targets: [
        { kind: "permanent", filter: { type: "creature", power: { op: "lte", n: 3 } } },
      ],
      effect: { kind: "grant-keyword", target: 0, keyword: "unblockable", duration: "end-of-turn" },
      resolve: null,
      text: "{3}, {T}: Target creature with power 3 or less can't be blocked this turn.",
    },
  ],
});
