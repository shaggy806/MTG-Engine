import { defineCard } from "../define.js";

export default defineCard({
  name: "Tyrranax",
  manaCost: "{4}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Dinosaur", "Beast"],
  power: 5,
  toughness: 4,
  text: "{1}{G}: This creature gets -1/+1 until end of turn.",
  activated: [
    {
      cost: { mana: "{1}{G}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: -1, toughness: 1, duration: "end-of-turn" },
      resolve: null,
      text: "{1}{G}: This creature gets -1/+1 until end of turn.",
    },
  ],
});
