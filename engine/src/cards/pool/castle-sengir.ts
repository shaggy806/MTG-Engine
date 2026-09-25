import { defineCard } from "../define.js";

export default defineCard({
  name: "Castle Sengir",
  colors: [],
  types: ["land"],
  text: "{T}: Add {C}.\n{1}, {T}: Add {B}.\n{2}, {T}: Add {U} or {R}.",
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
      effect: { kind: "add-mana", mana: "B", amount: 1 },
      resolve: null,
      text: "{1}, {T}: Add {B}.",
    },
    {
      cost: { mana: "{2}", tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["U", "R"] }, amount: 1 },
      resolve: null,
      text: "{2}, {T}: Add {U} or {R}.",
    },
  ],
});
