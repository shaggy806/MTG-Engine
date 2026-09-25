import { defineCard } from "../define.js";

export default defineCard({
  name: "Crackling Cyclops",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Cyclops", "Wizard"],
  power: 0,
  toughness: 4,
  text: "Whenever you cast a noncreature spell, this creature gets +3/+0 until end of turn.",
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", noncreatureOnly: true },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 3, toughness: 0, duration: "end-of-turn" },
      resolve: null,
      text: "Whenever you cast a noncreature spell, this creature gets +3/+0 until end of turn.",
    },
  ],
});
