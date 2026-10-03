import { defineCard } from "../define.js";
import { distinctTargets } from "../helpers.js";

const ETB_TEXT = "When this creature enters, return up to two other target nonland permanents to their owners' hands.";

// An omen card (rule 720): cast as the creature, or as Coil and Catch. The
// two returns are one instruction: they leave together.
export default defineCard({
  name: "Marang River Regent",
  manaCost: "{4}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 6,
  toughness: 7,
  keywords: ["flying"],
  text: `Flying\n${ETB_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: distinctTargets(2, { kind: "other", of: "nonland-permanent" }, { optional: true }),
      effect: {
        kind: "sequence",
        simultaneous: true,
        effects: [
          { kind: "return-to-hand", target: 0 },
          { kind: "return-to-hand", target: 1 },
        ],
      },
      resolve: null,
      text: ETB_TEXT,
    },
  ],
  faces: ["Marang River Regent", "Coil and Catch"],
  omen: true,
});
