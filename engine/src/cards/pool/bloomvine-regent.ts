import { defineCard } from "../define.js";
import { thisOrAnother } from "../helpers.js";

const LIFE_TEXT = "Whenever this creature or another Dragon you control enters, you gain 3 life.";

// An omen card (rule 720): cast as the creature, or as Claim Territory.
// Entering alongside other Dragons, it triggers for each of them and itself
// (the ruling).
export default defineCard({
  name: "Bloomvine Regent",
  manaCost: "{3}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 4,
  toughness: 5,
  keywords: ["flying"],
  text: `Flying\n${LIFE_TEXT}`,
  triggered: [
    ...thisOrAnother({
      trigger: { on: "enters-battlefield", who: "you-control", filter: { subtype: "Dragon" } },
      targets: [],
      effect: { kind: "gain-life", amount: 3 },
      resolve: null,
      text: LIFE_TEXT,
    }),
  ],
  faces: ["Bloomvine Regent", "Claim Territory"],
  omen: true,
});
