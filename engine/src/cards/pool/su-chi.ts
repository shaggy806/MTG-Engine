import { defineCard } from "../define.js";

export default defineCard({
  name: "Su-Chi",
  manaCost: "{4}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Construct"],
  power: 4,
  toughness: 4,
  text: "When this creature dies, add {C}{C}{C}{C}.",
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 4 },
      resolve: null,
      text: "When this creature dies, add {C}{C}{C}{C}.",
    },
  ],
});
