import { defineCard } from "../define.js";

export default defineCard({
  name: "Goring Ceratops",
  manaCost: "{5}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Dinosaur"],
  power: 3,
  toughness: 3,
  keywords: ["double-strike"],
  text: "Double strike\nWhenever this creature attacks, other creatures you control gain double strike until end of turn.",
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: {
        kind: "grant-keyword-all",
        filter: { type: "creature", controlledBy: "you" },
        keyword: "double-strike",
        duration: "end-of-turn",
        exceptSource: true,
      },
      resolve: null,
      text: "Whenever this creature attacks, other creatures you control gain double strike until end of turn.",
    },
  ],
});
