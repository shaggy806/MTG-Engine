import { defineCard } from "../define.js";

export default defineCard({
  name: "Wyluli Wolf",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Wolf"],
  power: 1,
  toughness: 1,
  text: "{T}: Target creature gets +1/+1 until end of turn.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: 1, toughness: 1, duration: "end-of-turn" },
      resolve: null,
      text: "{T}: Target creature gets +1/+1 until end of turn.",
    },
  ],
});
