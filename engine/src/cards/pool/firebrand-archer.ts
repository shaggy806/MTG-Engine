import { defineCard } from "../define.js";

export default defineCard({
  name: "Firebrand Archer",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Archer"],
  power: 2,
  toughness: 1,
  text: "Whenever you cast a noncreature spell, this creature deals 1 damage to each opponent.",
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", noncreatureOnly: true },
      targets: [],
      effect: { kind: "damage", amount: 1, who: "each-opponent" },
      resolve: null,
      text: "Whenever you cast a noncreature spell, this creature deals 1 damage to each opponent.",
    },
  ],
});
