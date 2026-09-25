import { defineCard } from "../define.js";

export default defineCard({
  name: "Null Brooch",
  manaCost: "{4}",
  colors: [],
  types: ["artifact"],
  text: "{2}, {T}, Discard your hand: Counter target noncreature spell.",
  activated: [
    {
      cost: { mana: "{2}", tap: true, discardHand: true },
      targets: ["noncreature-spell"],
      effect: { kind: "counter", target: 0 },
      resolve: null,
      text: "{2}, {T}, Discard your hand: Counter target noncreature spell.",
    },
  ],
});
