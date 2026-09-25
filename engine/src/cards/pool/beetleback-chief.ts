import { defineCard } from "../define.js";

export default defineCard({
  name: "Beetleback Chief",
  manaCost: "{2}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Goblin", "Warrior"],
  power: 2,
  toughness: 2,
  text: "When this creature enters, create two 1/1 red Goblin creature tokens.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Goblin Token", count: 2 },
      resolve: null,
      text: "When this creature enters, create two 1/1 red Goblin creature tokens.",
    },
  ],
});
