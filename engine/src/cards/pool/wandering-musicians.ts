import { defineCard } from "../define.js";

export default defineCard({
  name: "Wandering Musicians",
  manaCost: "{3}{R/W}",
  colors: ["W", "R"],
  types: ["creature"],
  subtypes: ["Human", "Bard", "Ally"],
  power: 2,
  toughness: 5,
  text: "Whenever this creature attacks, creatures you control get +1/+0 until end of turn.",
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: {
        kind: "modify-pt-all",
        filter: { type: "creature", controlledBy: "you" },
        power: 1,
        toughness: 0,
        duration: "end-of-turn",
      },
      resolve: null,
      text: "Whenever this creature attacks, creatures you control get +1/+0 until end of turn.",
    },
  ],
});
