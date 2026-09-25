import { defineCard } from "../define.js";

export default defineCard({
  name: "Student of Ojutai",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Monk"],
  power: 2,
  toughness: 4,
  text: "Whenever you cast a noncreature spell, you gain 2 life.",
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", noncreatureOnly: true },
      targets: [],
      effect: { kind: "gain-life", amount: 2 },
      resolve: null,
      text: "Whenever you cast a noncreature spell, you gain 2 life.",
    },
  ],
});
