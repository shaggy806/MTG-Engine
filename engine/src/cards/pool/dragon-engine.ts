import { defineCard } from "../define.js";

export default defineCard({
  name: "Dragon Engine",
  manaCost: "{3}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Dragon", "Construct"],
  power: 1,
  toughness: 3,
  text: "{2}: This creature gets +1/+0 until end of turn.",
  activated: [
    {
      cost: { mana: "{2}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: 0, duration: "end-of-turn" },
      resolve: null,
      text: "{2}: This creature gets +1/+0 until end of turn.",
    },
  ],
});
