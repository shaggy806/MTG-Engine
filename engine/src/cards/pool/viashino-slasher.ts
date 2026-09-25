import { defineCard } from "../define.js";

export default defineCard({
  name: "Viashino Slasher",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Lizard", "Warrior"],
  power: 1,
  toughness: 2,
  text: "{R}: This creature gets +1/-1 until end of turn.",
  activated: [
    {
      cost: { mana: "{R}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: -1, duration: "end-of-turn" },
      resolve: null,
      text: "{R}: This creature gets +1/-1 until end of turn.",
    },
  ],
});
