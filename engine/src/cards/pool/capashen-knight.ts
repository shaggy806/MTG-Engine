import { defineCard } from "../define.js";

export default defineCard({
  name: "Capashen Knight",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Knight"],
  power: 1,
  toughness: 1,
  keywords: ["first-strike"],
  text: "First strike (This creature deals combat damage before creatures without first strike.)\n{1}{W}: This creature gets +1/+0 until end of turn.",
  activated: [
    {
      cost: { mana: "{1}{W}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: 0, duration: "end-of-turn" },
      resolve: null,
      text: "{1}{W}: This creature gets +1/+0 until end of turn.",
    },
  ],
});
