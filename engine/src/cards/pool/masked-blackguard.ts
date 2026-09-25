import { defineCard } from "../define.js";

export default defineCard({
  name: "Masked Blackguard",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Human", "Rogue"],
  power: 2,
  toughness: 1,
  keywords: ["flash"],
  text: "Flash (You may cast this spell any time you could cast an instant.)\n{2}{B}: This creature gets +1/+1 until end of turn.",
  activated: [
    {
      cost: { mana: "{2}{B}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: 1, duration: "end-of-turn" },
      resolve: null,
      text: "{2}{B}: This creature gets +1/+1 until end of turn.",
    },
  ],
});
