import { defineCard } from "../define.js";

export default defineCard({
  name: "Sands of Delirium",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: "{X}, {T}: Target player mills X cards.",
  activated: [
    {
      cost: { mana: "{X}", tap: true },
      targets: ["player"],
      effect: { kind: "mill", target: 0, amount: "x" },
      resolve: null,
      text: "{X}, {T}: Target player mills X cards.",
    },
  ],
});
