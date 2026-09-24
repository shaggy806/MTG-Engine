import { defineCard } from "../define.js";

export default defineCard({
  name: "Conjurer's Closet",
  manaCost: "{5}",
  colors: [],
  types: ["artifact"],
  text:
    "At the beginning of your end step, you may exile target creature you control, then return that card to the battlefield under your control.",
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      targets: ["creature-you-control"],
      effect: {
        kind: "may",
        prompt: "Exile the creature and return it?",
        effect: { kind: "flicker", target: 0, underYourControl: true },
      },
      resolve: null,
      text:
        "At the beginning of your end step, you may exile target creature you control, then return that card to the battlefield under your control.",
    },
  ],
});
