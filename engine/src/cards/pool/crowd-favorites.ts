import { defineCard } from "../define.js";

export default defineCard({
  name: "Crowd Favorites",
  manaCost: "{6}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 4,
  toughness: 4,
  text: "{3}{W}: Tap target creature.\n{3}{W}: This creature gets +0/+5 until end of turn.",
  activated: [
    {
      cost: { mana: "{3}{W}", tap: false },
      targets: ["creature"],
      effect: { kind: "tap", target: 0 },
      resolve: null,
      text: "{3}{W}: Tap target creature.",
    },
    {
      cost: { mana: "{3}{W}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 0, toughness: 5, duration: "end-of-turn" },
      resolve: null,
      text: "{3}{W}: This creature gets +0/+5 until end of turn.",
    },
  ],
});
