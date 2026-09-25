import { defineCard } from "../define.js";

export default defineCard({
  name: "Cabal Trainee",
  manaCost: "{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Human", "Minion"],
  power: 1,
  toughness: 1,
  text: "Sacrifice this creature: Target creature gets -2/-0 until end of turn.",
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: "self" },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: -2, toughness: 0, duration: "end-of-turn" },
      resolve: null,
      text: "Sacrifice this creature: Target creature gets -2/-0 until end of turn.",
    },
  ],
});
