import { defineCard } from "../define.js";

export default defineCard({
  name: "Emeria Angel",
  manaCost: "{2}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Angel"],
  power: 3,
  toughness: 3,
  keywords: ["flying"],
  text:
    "Flying\n" +
    "Landfall — Whenever a land you control enters, you may create a 1/1 white " +
    "Bird creature token with flying.",
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you",
        filter: { type: "land", controlledBy: "you" },
      },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Create a 1/1 white Bird creature token with flying?",
        effect: { kind: "create-token", token: "Bird Token", count: 1 },
      },
      resolve: null,
      text:
        "Landfall — Whenever a land you control enters, you may create a 1/1 white " +
        "Bird creature token with flying.",
    },
  ],
});
