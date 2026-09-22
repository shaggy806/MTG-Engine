import { defineCard } from "../define.js";

/** 1/1 white Monk with prowess — Elsha, Threefold Master's token. */
export default defineCard({
  name: "Monk Token",
  art: "633d2d10-def7-426f-8496-ed6b45684299",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Monk"],
  power: 1,
  toughness: 1,
  text:
    "Prowess (Whenever you cast a noncreature spell, this creature gets +1/+1 until " +
    "end of turn.)",
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
      text: "Prowess — whenever you cast a noncreature spell, this token gets +1/+1 until end of turn.",
    },
  ],
});
