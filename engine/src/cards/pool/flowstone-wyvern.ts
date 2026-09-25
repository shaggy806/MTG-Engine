import { defineCard } from "../define.js";

export default defineCard({
  name: "Flowstone Wyvern",
  manaCost: "{3}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Drake"],
  power: 3,
  toughness: 3,
  keywords: ["flying"],
  text: "Flying\n{R}: This creature gets +2/-2 until end of turn.",
  activated: [
    {
      cost: { mana: "{R}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 2, toughness: -2, duration: "end-of-turn" },
      resolve: null,
      text: "{R}: This creature gets +2/-2 until end of turn.",
    },
  ],
});
