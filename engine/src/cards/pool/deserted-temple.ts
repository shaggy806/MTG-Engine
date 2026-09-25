import { defineCard } from "../define.js";

export default defineCard({
  name: "Deserted Temple",
  colors: [],
  types: ["land"],
  text: "{T}: Add {C}.\n{1}, {T}: Untap target land.",
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
      effect: { kind: "untap", target: 0 },
      resolve: null,
      text: "{1}, {T}: Untap target land.",
    },
  ],
});
