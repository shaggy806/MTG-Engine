import { defineCard } from "../define.js";

export default defineCard({
  name: "Novice Inspector",
  manaCost: "{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Detective"],
  power: 1,
  toughness: 2,
  text: "When this creature enters, investigate. (Create a Clue token. It's an artifact with \"{2}, Sacrifice this token: Draw a card.\")",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Clue Token", count: 1 },
      resolve: null,
      text: "When this creature enters, investigate.",
    },
  ],
});
