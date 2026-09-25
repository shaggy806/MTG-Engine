import { defineCard } from "../define.js";

export default defineCard({
  name: "Chimney Rabble",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Phyrexian", "Goblin", "Warrior"],
  power: 3,
  toughness: 3,
  keywords: ["haste"],
  text: "Haste\nWhen this creature enters, create a 1/1 red Phyrexian Goblin creature token.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Phyrexian Goblin Token", count: 1 },
      resolve: null,
      text: "When this creature enters, create a 1/1 red Phyrexian Goblin creature token.",
    },
  ],
});
