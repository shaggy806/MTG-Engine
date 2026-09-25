import { defineCard } from "../define.js";

export default defineCard({
  name: "Koskun Keep",
  colors: [],
  types: ["land"],
  text: "{T}: Add {C}.\n{1}, {T}: Add {R}.\n{2}, {T}: Add {B} or {G}.",
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
      effect: { kind: "add-mana", mana: "R", amount: 1 },
      resolve: null,
      text: "{1}, {T}: Add {R}.",
    },
    {
      cost: { mana: "{2}", tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["B", "G"] }, amount: 1 },
      resolve: null,
      text: "{2}, {T}: Add {B} or {G}.",
    },
  ],
});
