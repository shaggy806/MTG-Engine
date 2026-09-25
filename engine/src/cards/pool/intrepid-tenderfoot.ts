import { defineCard } from "../define.js";

export default defineCard({
  name: "Intrepid Tenderfoot",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Insect", "Citizen"],
  power: 2,
  toughness: 2,
  text: "{3}: Put a +1/+1 counter on this creature. Activate only as a sorcery.",
  activated: [
    {
      cost: { mana: "{3}", tap: false },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "{3}: Put a +1/+1 counter on this creature. Activate only as a sorcery.",
      sorcerySpeed: true,
    },
  ],
});
