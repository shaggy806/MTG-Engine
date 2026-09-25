import { defineCard } from "../define.js";

export default defineCard({
  name: "An-Havva Township",
  colors: [],
  types: ["land"],
  text: "{T}: Add {C}.\n{1}, {T}: Add {G}.\n{2}, {T}: Add {R} or {W}.",
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
      effect: { kind: "add-mana", mana: "G", amount: 1 },
      resolve: null,
      text: "{1}, {T}: Add {G}.",
    },
    {
      cost: { mana: "{2}", tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["R", "W"] }, amount: 1 },
      resolve: null,
      text: "{2}, {T}: Add {R} or {W}.",
    },
  ],
});
