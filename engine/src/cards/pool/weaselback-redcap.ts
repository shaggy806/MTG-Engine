import { defineCard } from "../define.js";

export default defineCard({
  name: "Weaselback Redcap",
  manaCost: "{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Goblin", "Knight"],
  power: 1,
  toughness: 1,
  text: "{1}{R}: This creature gets +2/+0 until end of turn.",
  activated: [
    {
      cost: { mana: "{1}{R}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 2, toughness: 0, duration: "end-of-turn" },
      resolve: null,
      text: "{1}{R}: This creature gets +2/+0 until end of turn.",
    },
  ],
});
