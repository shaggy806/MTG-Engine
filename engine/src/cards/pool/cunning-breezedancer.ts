import { defineCard } from "../define.js";

export default defineCard({
  name: "Cunning Breezedancer",
  manaCost: "{4}{W}{U}",
  colors: ["W", "U"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 4,
  toughness: 4,
  keywords: ["flying"],
  text: "Flying\nWhenever you cast a noncreature spell, this creature gets +2/+2 until end of turn.",
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
