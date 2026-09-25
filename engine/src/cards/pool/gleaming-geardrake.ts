import { defineCard } from "../define.js";

export default defineCard({
  name: "Gleaming Geardrake",
  manaCost: "{U}{R}",
  colors: ["U", "R"],
  types: ["artifact", "creature"],
  subtypes: ["Drake"],
  power: 1,
  toughness: 1,
  keywords: ["flying"],
  text: "Flying\nWhen this creature enters, investigate. (Create a Clue token. It's an artifact with \"{2}, Sacrifice this token: Draw a card.\")\nWhenever you sacrifice an artifact, put a +1/+1 counter on this creature.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Clue Token", count: 1 },
      resolve: null,
      text: "When this creature enters, investigate.",
    },
    {
      trigger: { on: "sacrifice", who: "you", filter: { type: "artifact" } },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "Whenever you sacrifice an artifact, put a +1/+1 counter on this creature.",
    },
  ],
});
