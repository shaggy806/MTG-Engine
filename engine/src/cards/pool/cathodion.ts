import { defineCard } from "../define.js";

export default defineCard({
  name: "Cathodion",
  manaCost: "{3}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Construct"],
  power: 3,
  toughness: 3,
  text: "When this creature dies, add {C}{C}{C}.",
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 3 },
      resolve: null,
      text: "When this creature dies, add {C}{C}{C}.",
    },
  ],
});
