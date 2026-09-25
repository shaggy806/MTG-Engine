import { defineCard } from "../define.js";

export default defineCard({
  name: "Bloodrage Brawler",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Minotaur", "Warrior"],
  power: 4,
  toughness: 3,
  text: "When this creature enters, discard a card.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "discard", target: "you", amount: 1 },
      resolve: null,
      text: "When this creature enters, discard a card.",
    },
  ],
});
