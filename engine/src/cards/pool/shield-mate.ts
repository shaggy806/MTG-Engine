import { defineCard } from "../define.js";

export default defineCard({
  name: "Shield Mate",
  manaCost: "{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 1,
  toughness: 1,
  text: "Sacrifice this creature: Target creature gets +0/+4 until end of turn.",
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: "self" },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: 0, toughness: 4, duration: "end-of-turn" },
      resolve: null,
      text: "Sacrifice this creature: Target creature gets +0/+4 until end of turn.",
    },
  ],
});
