import { defineCard } from "../define.js";

export default defineCard({
  name: "Wizards' School",
  colors: [],
  types: ["land"],
  text: "{T}: Add {C}.\n{1}, {T}: Add {U}.\n{2}, {T}: Add {W} or {B}.",
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
      effect: { kind: "add-mana", mana: "U", amount: 1 },
      resolve: null,
      text: "{1}, {T}: Add {U}.",
    },
    {
      cost: { mana: "{2}", tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["W", "B"] }, amount: 1 },
      resolve: null,
      text: "{2}, {T}: Add {W} or {B}.",
    },
  ],
});
