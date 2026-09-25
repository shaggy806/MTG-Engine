import { defineCard } from "../define.js";

export default defineCard({
  name: "Deadbridge Shaman",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Elf", "Shaman"],
  power: 3,
  toughness: 1,
  text: "When this creature dies, target opponent discards a card.",
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: ["opponent"],
      effect: { kind: "discard", target: 0, amount: 1 },
      resolve: null,
      text: "When this creature dies, target opponent discards a card.",
    },
  ],
});
