import { defineCard } from "../define.js";

export default defineCard({
  name: "Loxodon Stalwart",
  manaCost: "{3}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Elephant", "Soldier"],
  power: 3,
  toughness: 3,
  keywords: ["vigilance"],
  text: "Vigilance\n{W}: This creature gets +0/+1 until end of turn.",
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
