import { defineCard } from "../define.js";

export default defineCard({
  name: "Kabuto Moth",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Spirit"],
  power: 1,
  toughness: 2,
  keywords: ["flying"],
  text: "Flying\n{T}: Target creature gets +1/+2 until end of turn.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: 1, toughness: 2, duration: "end-of-turn" },
      resolve: null,
      text: "{T}: Target creature gets +1/+2 until end of turn.",
    },
  ],
});
