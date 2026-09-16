import { defineCard } from "../define.js";

export default defineCard({
  name: "Dauntless Escort",
  manaCost: "{1}{G}{W}",
  colors: ["G", "W"],
  types: ["creature"],
  subtypes: ["Rhino", "Soldier"],
  power: 3,
  toughness: 3,
  text: "Sacrifice Dauntless Escort: Creatures you control gain indestructible until end of turn.",
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
      text:
        "Sacrifice Dauntless Escort: Creatures you control gain indestructible " +
        "until end of turn.",
    },
  ],
});
