import { defineCard } from "../define.js";

export default defineCard({
  name: "Fire Drake",
  manaCost: "{1}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Drake"],
  power: 1,
  toughness: 2,
  keywords: ["flying"],
  text: "Flying\n{R}: This creature gets +1/+0 until end of turn. Activate only once each turn.",
  activated: [
    {
      cost: { mana: "{R}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: 0, duration: "end-of-turn" },
      resolve: null,
      text: "{R}: This creature gets +1/+0 until end of turn. Activate only once each turn.",
      oncePerTurn: true,
    },
  ],
});
