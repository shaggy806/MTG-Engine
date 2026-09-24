import { defineCard } from "../define.js";

export default defineCard({
  name: "Selfless Spirit",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Spirit", "Cleric"],
  power: 2,
  toughness: 1,
  keywords: ["flying"],
  text: "Flying\nSacrifice this creature: Creatures you control gain indestructible until end of turn.",
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: "self" },
      targets: [],
      effect: {
        kind: "grant-keyword-all",
        filter: { type: "creature", controlledBy: "you" },
        keyword: "indestructible",
        duration: "end-of-turn",
      },
      resolve: null,
      text: "Sacrifice this creature: Creatures you control gain indestructible until end of turn.",
    },
  ],
});
