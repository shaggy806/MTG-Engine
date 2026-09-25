import { defineCard } from "../define.js";

export default defineCard({
  name: "Serra Advocate",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Angel"],
  power: 2,
  toughness: 2,
  keywords: ["flying"],
  text: "Flying\n{T}: Target attacking or blocking creature gets +2/+2 until end of turn.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: ["attacking-or-blocking-creature"],
      effect: { kind: "modify-pt", target: 0, power: 2, toughness: 2, duration: "end-of-turn" },
      resolve: null,
      text: "{T}: Target attacking or blocking creature gets +2/+2 until end of turn.",
    },
  ],
});
