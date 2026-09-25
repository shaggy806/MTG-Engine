import { defineCard } from "../define.js";

export default defineCard({
  name: "Sky Theater Strix",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Bird"],
  power: 1,
  toughness: 2,
  keywords: ["flying"],
  text: "Flying\nWhenever you cast a noncreature spell, this creature gets +1/+0 until end of turn.",
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", noncreatureOnly: true },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: 0, duration: "end-of-turn" },
      resolve: null,
      text: "Whenever you cast a noncreature spell, this creature gets +1/+0 until end of turn.",
    },
  ],
});
