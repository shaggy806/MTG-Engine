import { defineCard } from "../define.js";

// EDHREC rank 4076.

export default defineCard({
  name: "Zo-Zu the Punisher",
  manaCost: "{1}{R}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Goblin", "Warrior"],
  power: 2,
  toughness: 2,
  text: "Whenever a land enters, Zo-Zu deals 2 damage to that land's controller.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "any", filter: { type: "land" } },
      targets: [],
      // Rampaging Ferocidon's shape: "that creature's controller".
      effect: { kind: "damage", amount: 2, who: "trigger-controller" },
      resolve: null,
      text: "Whenever a land enters, Zo-Zu deals 2 damage to that land's controller.",
    },
  ],
});
