import { defineCard } from "../define.js";

export default defineCard({
  name: "Adarkar Sentinel",
  manaCost: "{5}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Soldier"],
  power: 3,
  toughness: 3,
  text: "{1}: This creature gets +0/+1 until end of turn.",
  activated: [
    {
      cost: { mana: "{1}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 0, toughness: 1, duration: "end-of-turn" },
      resolve: null,
      text: "{1}: This creature gets +0/+1 until end of turn.",
    },
  ],
});
