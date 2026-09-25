import { defineCard } from "../define.js";

export default defineCard({
  name: "Lavafume Invoker",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Goblin", "Shaman"],
  power: 2,
  toughness: 2,
  text: "{8}: Creatures you control get +3/+0 until end of turn.",
  activated: [
    {
      cost: { mana: "{8}", tap: false },
      targets: [],
      effect: {
        kind: "modify-pt-all",
        filter: { type: "creature", controlledBy: "you" },
        power: 3,
        toughness: 0,
        duration: "end-of-turn",
      },
      resolve: null,
      text: "{8}: Creatures you control get +3/+0 until end of turn.",
    },
  ],
});
