import { defineCard } from "../define.js";

export default defineCard({
  name: "Strongarm Monk",
  manaCost: "{4}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Monk"],
  power: 3,
  toughness: 3,
  text: "Whenever you cast a noncreature spell, creatures you control get +1/+1 until end of turn.",
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", noncreatureOnly: true },
      targets: [],
      effect: {
        kind: "modify-pt-all",
        filter: { type: "creature", controlledBy: "you" },
        power: 1,
        toughness: 1,
        duration: "end-of-turn",
      },
      resolve: null,
      text: "Whenever you cast a noncreature spell, creatures you control get +1/+1 until end of turn.",
    },
  ],
});
