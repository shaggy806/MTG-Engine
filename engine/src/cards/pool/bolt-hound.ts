import { defineCard } from "../define.js";

export default defineCard({
  name: "Bolt Hound",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Elemental", "Dog"],
  power: 2,
  toughness: 2,
  keywords: ["haste"],
  text: "Haste (This creature can attack and {T} as soon as it comes under your control.)\nWhenever this creature attacks, other creatures you control get +1/+0 until end of turn.",
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
        exceptSource: true,
      },
      resolve: null,
      text: "Whenever this creature attacks, other creatures you control get +1/+0 until end of turn.",
    },
  ],
});
