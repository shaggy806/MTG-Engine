import { defineCard } from "../define.js";

export default defineCard({
  name: "Elderfang Disciple",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Elf", "Cleric"],
  power: 1,
  toughness: 1,
  text: "When this creature enters, each opponent discards a card.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "discard", target: "each-opponent", amount: 1 },
      resolve: null,
      text: "When this creature enters, each opponent discards a card.",
    },
  ],
});
