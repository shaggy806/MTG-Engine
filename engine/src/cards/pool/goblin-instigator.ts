import { defineCard } from "../define.js";

export default defineCard({
  name: "Goblin Instigator",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Goblin", "Rogue"],
  power: 1,
  toughness: 1,
  text: "When this creature enters, create a 1/1 red Goblin creature token.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Goblin Token", count: 1 },
      resolve: null,
      text: "When this creature enters, create a 1/1 red Goblin creature token.",
    },
  ],
});
