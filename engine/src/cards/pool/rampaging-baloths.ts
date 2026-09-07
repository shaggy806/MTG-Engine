import { defineCard } from "../define.js";

export default defineCard({
  name: "Rampaging Baloths",
  manaCost: "{4}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Beast"],
  power: 6,
  toughness: 6,
  keywords: ["trample"],
  text:
    "Trample\nLandfall — Whenever a land you control enters, you may create a 4/4 green Beast creature token.",
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { type: "land" },
      },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Create a 4/4 green Beast token?",
        effect: { kind: "create-token", token: "Beast Token", count: 1 },
      },
      resolve: null,
      text:
        "Landfall — Whenever a land you control enters, you may create a 4/4 green Beast creature token.",
    },
  ],
});
