import { defineCard } from "../define.js";

const TEXT = "At the beginning of your end step, you may gain life equal to the power of target creature you control.";

export default defineCard({
  name: "Wall of Reverence",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Spirit", "Wall"],
  power: 1,
  toughness: 6,
  keywords: ["defender", "flying"],
  text: `Defender, flying\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      targets: ["creature-you-control"],
      effect: { kind: "may", prompt: "Gain life equal to its power?", effect: { kind: "gain-life", amount: { powerOf: 0 } } },
      resolve: null,
      text: TEXT,
    },
  ],
});
