import { defineCard } from "../define.js";

export default defineCard({
  name: "Jousting Dummy",
  manaCost: "{2}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Scarecrow", "Knight"],
  power: 2,
  toughness: 1,
  text: "{3}: This creature gets +1/+0 until end of turn.",
  activated: [
    {
      cost: { mana: "{3}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: 0, duration: "end-of-turn" },
      resolve: null,
      text: "{3}: This creature gets +1/+0 until end of turn.",
    },
  ],
});
