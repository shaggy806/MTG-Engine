import { defineCard } from "../define.js";

export default defineCard({
  name: "Akki Rockspeaker",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Goblin", "Shaman"],
  power: 1,
  toughness: 1,
  text: "When this creature enters, add {R}.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "add-mana", mana: "R", amount: 1 },
      resolve: null,
      text: "When this creature enters, add {R}.",
    },
  ],
});
