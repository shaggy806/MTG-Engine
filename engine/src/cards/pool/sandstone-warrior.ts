import { defineCard } from "../define.js";

export default defineCard({
  name: "Sandstone Warrior",
  manaCost: "{2}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Soldier", "Warrior"],
  power: 1,
  toughness: 3,
  keywords: ["first-strike"],
  text: "First strike (This creature deals combat damage before creatures without first strike.)\n{R}: This creature gets +1/+0 until end of turn.",
  activated: [
    {
      cost: { mana: "{R}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: 0, duration: "end-of-turn" },
      resolve: null,
      text: "{R}: This creature gets +1/+0 until end of turn.",
    },
  ],
});
