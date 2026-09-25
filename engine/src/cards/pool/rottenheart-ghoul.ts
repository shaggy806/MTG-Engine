import { defineCard } from "../define.js";

export default defineCard({
  name: "Rottenheart Ghoul",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie"],
  power: 2,
  toughness: 4,
  text: "When this creature dies, target player discards a card.",
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: ["player"],
      effect: { kind: "discard", target: 0, amount: 1 },
      resolve: null,
      text: "When this creature dies, target player discards a card.",
    },
  ],
});
