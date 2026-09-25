import { defineCard } from "../define.js";

export default defineCard({
  name: "Pearl Dragon",
  manaCost: "{4}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 4,
  toughness: 4,
  keywords: ["flying"],
  text: "Flying\n{1}{W}: This creature gets +0/+1 until end of turn.",
  activated: [
    {
      cost: { mana: "{1}{W}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 0, toughness: 1, duration: "end-of-turn" },
      resolve: null,
      text: "{1}{W}: This creature gets +0/+1 until end of turn.",
    },
  ],
});
