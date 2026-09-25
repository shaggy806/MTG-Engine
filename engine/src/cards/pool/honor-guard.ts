import { defineCard } from "../define.js";

export default defineCard({
  name: "Honor Guard",
  manaCost: "{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 1,
  toughness: 1,
  text: "{W}: This creature gets +0/+1 until end of turn.",
  activated: [
    {
      cost: { mana: "{W}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 0, toughness: 1, duration: "end-of-turn" },
      resolve: null,
      text: "{W}: This creature gets +0/+1 until end of turn.",
    },
  ],
});
