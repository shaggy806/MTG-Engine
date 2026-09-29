import { defineCard } from "../define.js";
import { enduringReturn } from "../helpers.js";

const DRAIN_TEXT = "Whenever you gain life, target opponent loses that much life.";

// Once per life-gain event (rule 119.9): two lifelinkers dealing combat
// damage together trigger it twice, each aimed where its controller likes.
export default defineCard({
  name: "Enduring Tenacity",
  manaCost: "{2}{B}{B}",
  colors: ["B"],
  types: ["enchantment", "creature"],
  subtypes: ["Snake", "Glimmer"],
  power: 4,
  toughness: 3,
  text: `${DRAIN_TEXT}\n${enduringReturn("Enduring Tenacity").text}`,
  triggered: [
    {
      trigger: { on: "gains-life", who: "you" },
      targets: ["opponent"],
      effect: { kind: "lose-life", amount: { triggerValue: true }, target: 0 },
      resolve: null,
      text: DRAIN_TEXT,
    },
    enduringReturn("Enduring Tenacity"),
  ],
});
