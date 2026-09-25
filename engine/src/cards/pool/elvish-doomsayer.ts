import { defineCard } from "../define.js";

export default defineCard({
  name: "Elvish Doomsayer",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Elf", "Shaman"],
  power: 1,
  toughness: 1,
  text: "When this creature dies, each opponent discards a card.",
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "discard", target: "each-opponent", amount: 1 },
      resolve: null,
      text: "When this creature dies, each opponent discards a card.",
    },
  ],
});
