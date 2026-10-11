import { defineCard } from "../define.js";

const ENTERS_TEXT = "When this creature enters, counter target spell. Its controller manifests dread.";

// "Its controller" is the countered spell's (rule 701.62a); with the spell
// gone before it resolves, the ability does nothing at all (608.2b).
export default defineCard({
  name: "Fear of Impostors",
  manaCost: "{1}{U}{U}",
  colors: ["U"],
  types: ["enchantment", "creature"],
  subtypes: ["Nightmare"],
  power: 3,
  toughness: 2,
  keywords: ["flash"],
  text: `Flash\n${ENTERS_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["spell"],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "counter", target: 0 },
          { kind: "manifest-dread", who: { controllerOfTarget: 0 } },
        ],
      },
      resolve: null,
      text: ENTERS_TEXT,
    },
  ],
});
