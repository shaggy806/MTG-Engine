import { defineCard } from "../define.js";

export default defineCard({
  name: "Aerie Mystics",
  manaCost: "{4}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Bird", "Wizard"],
  power: 3,
  toughness: 3,
  keywords: ["flying"],
  text: "Flying\n{1}{G}{U}: Creatures you control gain shroud until end of turn. (They can't be the targets of spells or abilities.)",
  activated: [
    {
      cost: { mana: "{1}{G}{U}", tap: false },
      targets: [],
      effect: {
        kind: "grant-keyword-all",
        filter: { type: "creature", controlledBy: "you" },
        keyword: "shroud",
        duration: "end-of-turn",
      },
      resolve: null,
      text: "{1}{G}{U}: Creatures you control gain shroud until end of turn.",
    },
  ],
});
