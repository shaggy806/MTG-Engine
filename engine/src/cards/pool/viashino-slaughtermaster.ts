import { defineCard } from "../define.js";

export default defineCard({
  name: "Viashino Slaughtermaster",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Lizard", "Warrior"],
  power: 1,
  toughness: 1,
  keywords: ["double-strike"],
  text: "Double strike\n{B}{G}: This creature gets +1/+1 until end of turn. Activate only once each turn.",
  activated: [
    {
      cost: { mana: "{B}{G}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: 1, duration: "end-of-turn" },
      resolve: null,
      text: "{B}{G}: This creature gets +1/+1 until end of turn. Activate only once each turn.",
      oncePerTurn: true,
    },
  ],
});
