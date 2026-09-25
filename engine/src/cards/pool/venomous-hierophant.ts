import { defineCard } from "../define.js";

export default defineCard({
  name: "Venomous Hierophant",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Gorgon", "Cleric"],
  power: 3,
  toughness: 3,
  keywords: ["deathtouch"],
  text: "Deathtouch (Any amount of damage this deals to a creature is enough to destroy it.)\nWhen this creature enters, mill three cards. (Put the top three cards of your library into your graveyard.)",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "mill", target: "you", amount: 3 },
      resolve: null,
      text: "When this creature enters, mill three cards.",
    },
  ],
});
