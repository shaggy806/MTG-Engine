import { defineCard } from "../define.js";

export default defineCard({
  name: "Forecasting Fortune Teller",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Advisor", "Ally"],
  power: 1,
  toughness: 3,
  text: "When this creature enters, create a Clue token. (It's an artifact with \"{2}, Sacrifice this token: Draw a card.\")",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Clue Token", count: 1 },
      resolve: null,
      text: "When this creature enters, create a Clue token.",
    },
  ],
});
