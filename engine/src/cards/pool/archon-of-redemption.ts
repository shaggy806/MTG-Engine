import { defineCard } from "../define.js";

export default defineCard({
  name: "Archon of Redemption",
  manaCost: "{3}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Archon"],
  power: 3,
  toughness: 4,
  keywords: ["flying"],
  text:
    "Flying\n" +
    "Whenever Archon of Redemption or another creature you control with flying " +
    "enters, you may gain life equal to that creature's power.",
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you",
        filter: { type: "creature", controlledBy: "you", keyword: "flying" },
      },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Gain life equal to that creature's power?",
        // `triggerValue` on an enters-battlefield trigger is the entering
        // creature's power, which is exactly what this asks for.
        effect: { kind: "gain-life", amount: { triggerValue: true } },
      },
      resolve: null,
      text:
        "Whenever Archon of Redemption or another creature you control with flying " +
        "enters, you may gain life equal to that creature's power.",
    },
  ],
});
