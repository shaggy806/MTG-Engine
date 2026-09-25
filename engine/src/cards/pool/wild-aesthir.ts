import { defineCard } from "../define.js";

export default defineCard({
  name: "Wild Aesthir",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Bird"],
  power: 1,
  toughness: 1,
  keywords: ["flying", "first-strike"],
  text: "Flying, first strike\n{W}{W}: This creature gets +2/+0 until end of turn. Activate only once each turn.",
  activated: [
    {
      cost: { mana: "{W}{W}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 2, toughness: 0, duration: "end-of-turn" },
      resolve: null,
      text: "{W}{W}: This creature gets +2/+0 until end of turn. Activate only once each turn.",
      oncePerTurn: true,
    },
  ],
});
