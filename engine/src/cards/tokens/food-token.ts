import { defineCard } from "../define.js";

export default defineCard({
  name: "Food Token",
  types: ["artifact"],
  subtypes: ["Food"],
  text: "{2}, {T}, Sacrifice this artifact: You gain 3 life.",
  activated: [
    {
      cost: { mana: "{2}", tap: true, sacrifice: "self" },
      targets: [],
      effect: { kind: "gain-life", amount: 3 },
      resolve: null,
      text: "{2}, {T}, Sacrifice this artifact: You gain 3 life.",
    },
  ],
});
