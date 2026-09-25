import { defineCard } from "../define.js";

export default defineCard({
  name: "Frenzied Devils",
  manaCost: "{4}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Devil"],
  power: 3,
  toughness: 3,
  keywords: ["haste"],
  text: "Haste\nWhenever you cast a noncreature spell, this creature gets +2/+2 until end of turn.",
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", noncreatureOnly: true },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 2, toughness: 2, duration: "end-of-turn" },
      resolve: null,
      text: "Whenever you cast a noncreature spell, this creature gets +2/+2 until end of turn.",
    },
  ],
});
