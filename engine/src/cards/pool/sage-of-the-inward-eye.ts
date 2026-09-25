import { defineCard } from "../define.js";

export default defineCard({
  name: "Sage of the Inward Eye",
  manaCost: "{2}{U}{R}{W}",
  colors: ["W", "U", "R"],
  types: ["creature"],
  subtypes: ["Djinn", "Wizard"],
  power: 3,
  toughness: 4,
  keywords: ["flying"],
  text: "Flying\nWhenever you cast a noncreature spell, creatures you control gain lifelink until end of turn.",
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", noncreatureOnly: true },
      targets: [],
      effect: {
        kind: "grant-keyword-all",
        filter: { type: "creature", controlledBy: "you" },
        keyword: "lifelink",
        duration: "end-of-turn",
      },
      resolve: null,
      text: "Whenever you cast a noncreature spell, creatures you control gain lifelink until end of turn.",
    },
  ],
});
