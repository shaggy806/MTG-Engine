import { defineCard } from "../define.js";

export default defineCard({
  name: "Devotee of Strength",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Snake", "Wizard"],
  power: 3,
  toughness: 2,
  text: "{4}{G}: Target creature gets +2/+2 until end of turn.",
  activated: [
    {
      cost: { mana: "{4}{G}", tap: false },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: 2, toughness: 2, duration: "end-of-turn" },
      resolve: null,
      text: "{4}{G}: Target creature gets +2/+2 until end of turn.",
    },
  ],
});
