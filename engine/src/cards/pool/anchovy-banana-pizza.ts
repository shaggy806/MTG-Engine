import { defineCard } from "../define.js";

export default defineCard({
  name: "Anchovy & Banana Pizza",
  manaCost: "{2}{B}{B}",
  colors: ["B"],
  types: ["artifact"],
  subtypes: ["Food"],
  text: "When this artifact enters, destroy target creature.\n{2}, {T}, Sacrifice this artifact: You gain 3 life.",
  activated: [
    {
      cost: { mana: "{2}", tap: true, sacrifice: "self" },
      targets: [],
      effect: { kind: "gain-life", amount: 3 },
      resolve: null,
      text: "{2}, {T}, Sacrifice this artifact: You gain 3 life.",
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["creature"],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: "When this artifact enters, destroy target creature.",
    },
  ],
});
