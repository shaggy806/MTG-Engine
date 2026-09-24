import { defineCard } from "../define.js";

export default defineCard({
  name: "Carrion Feeder",
  manaCost: "{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie"],
  power: 1,
  toughness: 1,
  text: "This creature can't block.\nSacrifice a creature: Put a +1/+1 counter on this creature.",
  static: [
    {
      affects: { scope: "self" },
      restrictions: ["cant-block"],
      text: "This creature can't block.",
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: "creature-you-control" },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "Sacrifice a creature: Put a +1/+1 counter on this creature.",
    },
  ],
});
