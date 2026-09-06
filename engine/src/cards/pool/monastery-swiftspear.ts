import { defineCard } from "../define.js";

export default defineCard({
  name: "Monastery Swiftspear",
  manaCost: "{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Monk"],
  power: 1,
  toughness: 2,
  keywords: ["haste"],
  text: "Haste. Prowess (Whenever you cast a noncreature spell, this creature gets +1/+1 until end of turn.)",
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", noncreatureOnly: true },
      targets: [],
      effect: {
        kind: "modify-pt",
        target: "source",
        power: 1,
        toughness: 1,
        duration: "end-of-turn",
      },
      resolve: null,
      text: "Prowess — whenever you cast a noncreature spell, Monastery Swiftspear gets +1/+1 until end of turn.",
    },
  ],
});
