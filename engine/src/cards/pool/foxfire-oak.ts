import { defineCard } from "../define.js";

export default defineCard({
  name: "Foxfire Oak",
  manaCost: "{5}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Treefolk", "Shaman"],
  power: 3,
  toughness: 6,
  text: "{R/G}{R/G}{R/G}: This creature gets +3/+0 until end of turn.",
  activated: [
    {
      cost: { mana: "{R/G}{R/G}{R/G}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 3, toughness: 0, duration: "end-of-turn" },
      resolve: null,
      text: "{R/G}{R/G}{R/G}: This creature gets +3/+0 until end of turn.",
    },
  ],
});
