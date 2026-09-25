import { defineCard } from "../define.js";

export default defineCard({
  name: "Icatian Priest",
  manaCost: "{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Cleric"],
  power: 1,
  toughness: 1,
  text: "{1}{W}{W}: Target creature gets +1/+1 until end of turn.",
  activated: [
    {
      cost: { mana: "{1}{W}{W}", tap: false },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: 1, toughness: 1, duration: "end-of-turn" },
      resolve: null,
      text: "{1}{W}{W}: Target creature gets +1/+1 until end of turn.",
    },
  ],
});
