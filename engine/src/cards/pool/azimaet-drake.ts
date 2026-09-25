import { defineCard } from "../define.js";

export default defineCard({
  name: "Azimaet Drake",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Drake"],
  power: 1,
  toughness: 3,
  keywords: ["flying"],
  text: "Flying\n{U}: This creature gets +1/+0 until end of turn. Activate only once each turn.",
  activated: [
    {
      cost: { mana: "{U}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: 0, duration: "end-of-turn" },
      resolve: null,
      text: "{U}: This creature gets +1/+0 until end of turn. Activate only once each turn.",
      oncePerTurn: true,
    },
  ],
});
