import { defineCard } from "../define.js";

export default defineCard({
  name: "Cathar's Companion",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Dog"],
  power: 3,
  toughness: 1,
  text: "Whenever you cast a noncreature spell, this creature gains indestructible until end of turn. (Damage and effects that say \"destroy\" don't destroy it.)",
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", noncreatureOnly: true },
      targets: [],
      effect: {
        kind: "grant-keyword",
        target: "source",
        keyword: "indestructible",
        duration: "end-of-turn",
      },
      resolve: null,
      text: "Whenever you cast a noncreature spell, this creature gains indestructible until end of turn.",
    },
  ],
});
