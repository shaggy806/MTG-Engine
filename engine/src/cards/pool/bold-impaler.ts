import { defineCard } from "../define.js";

export default defineCard({
  name: "Bold Impaler",
  manaCost: "{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Vampire", "Knight"],
  power: 1,
  toughness: 2,
  text: "{2}{R}: This creature gets +2/+0 until end of turn.",
  activated: [
    {
      cost: { mana: "{2}{R}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 2, toughness: 0, duration: "end-of-turn" },
      resolve: null,
      text: "{2}{R}: This creature gets +2/+0 until end of turn.",
    },
  ],
});
