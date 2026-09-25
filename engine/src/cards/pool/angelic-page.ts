import { defineCard } from "../define.js";

export default defineCard({
  name: "Angelic Page",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Angel", "Spirit"],
  power: 1,
  toughness: 1,
  keywords: ["flying"],
  text: "Flying\n{T}: Target attacking or blocking creature gets +1/+1 until end of turn.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: ["attacking-or-blocking-creature"],
      effect: { kind: "modify-pt", target: 0, power: 1, toughness: 1, duration: "end-of-turn" },
      resolve: null,
      text: "{T}: Target attacking or blocking creature gets +1/+1 until end of turn.",
    },
  ],
});
