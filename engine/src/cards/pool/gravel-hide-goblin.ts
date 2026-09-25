import { defineCard } from "../define.js";

export default defineCard({
  name: "Gravel-Hide Goblin",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Goblin", "Shaman"],
  power: 2,
  toughness: 1,
  text: "{3}{G}: This creature gets +2/+2 until end of turn.",
  activated: [
    {
      cost: { mana: "{3}{G}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 2, toughness: 2, duration: "end-of-turn" },
      resolve: null,
      text: "{3}{G}: This creature gets +2/+2 until end of turn.",
    },
  ],
});
