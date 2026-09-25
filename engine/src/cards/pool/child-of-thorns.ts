import { defineCard } from "../define.js";

export default defineCard({
  name: "Child of Thorns",
  manaCost: "{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Spirit"],
  power: 1,
  toughness: 1,
  text: "Sacrifice this creature: Target creature gets +1/+1 until end of turn.",
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: "self" },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: 1, toughness: 1, duration: "end-of-turn" },
      resolve: null,
      text: "Sacrifice this creature: Target creature gets +1/+1 until end of turn.",
    },
  ],
});
