import { defineCard } from "../define.js";

export default defineCard({
  name: "Aysen Abbey",
  colors: [],
  types: ["land"],
  text: "{T}: Add {C}.\n{1}, {T}: Add {W}.\n{2}, {T}: Add {G} or {U}.",
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
      effect: { kind: "add-mana", mana: "W", amount: 1 },
      resolve: null,
      text: "{1}, {T}: Add {W}.",
    },
    {
      cost: { mana: "{2}", tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["G", "U"] }, amount: 1 },
      resolve: null,
      text: "{2}, {T}: Add {G} or {U}.",
    },
  ],
});
