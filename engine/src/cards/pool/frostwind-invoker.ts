import { defineCard } from "../define.js";

export default defineCard({
  name: "Frostwind Invoker",
  manaCost: "{4}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Merfolk", "Wizard"],
  power: 3,
  toughness: 3,
  keywords: ["flying"],
  text: "Flying\n{8}: Creatures you control gain flying until end of turn.",
  activated: [
    {
      cost: { mana: "{8}", tap: false },
      targets: [],
      effect: {
        kind: "grant-keyword-all",
        filter: { type: "creature", controlledBy: "you" },
        keyword: "flying",
        duration: "end-of-turn",
      },
      resolve: null,
      text: "{8}: Creatures you control gain flying until end of turn.",
    },
  ],
});
