import { defineCard } from "../define.js";

export default defineCard({
  name: "Leonin Elder",
  manaCost: "{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Cat", "Cleric"],
  power: 1,
  toughness: 1,
  text: "Whenever an artifact enters, you may gain 1 life.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "any", filter: { type: "artifact" } },
      targets: [],
      effect: { kind: "may", prompt: "Gain 1 life?", effect: { kind: "gain-life", amount: 1 } },
      resolve: null,
      text: "Whenever an artifact enters, you may gain 1 life.",
    },
  ],
});
