import { defineCard } from "../define.js";

export default defineCard({
  name: "Rishadan Port",
  colors: [],
  types: ["land"],
  text: "{T}: Add {C}.\n{1}, {T}: Tap target land.",
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
      targets: ["land"],
      effect: { kind: "tap", target: 0 },
      resolve: null,
      text: "{1}, {T}: Tap target land.",
    },
  ],
});
