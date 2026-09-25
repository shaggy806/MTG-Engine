import { defineCard } from "../define.js";

export default defineCard({
  name: "Ebony Treefolk",
  manaCost: "{1}{B}{G}",
  colors: ["B", "G"],
  types: ["creature"],
  subtypes: ["Treefolk"],
  power: 3,
  toughness: 3,
  text: "{B}{G}: This creature gets +1/+1 until end of turn.",
  activated: [
    {
      cost: { mana: "{B}{G}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: 1, duration: "end-of-turn" },
      resolve: null,
      text: "{B}{G}: This creature gets +1/+1 until end of turn.",
    },
  ],
});
