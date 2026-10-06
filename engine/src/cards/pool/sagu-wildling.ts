import { defineCard } from "../define.js";

// EDHREC rank 6623.
// An omen card (rule 720): cast as the creature, or as Roost Seek.

const LIFE_TEXT = "When this creature enters, you gain 3 life.";

export default defineCard({
  name: "Sagu Wildling",
  manaCost: "{4}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 3,
  toughness: 3,
  keywords: ["flying"],
  text: `Flying\n${LIFE_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "gain-life", amount: 3 },
      resolve: null,
      text: LIFE_TEXT,
    },
  ],
  faces: ["Sagu Wildling", "Roost Seek"],
  omen: true,
});
