import { defineCard } from "../define.js";

const ENTER_TEXT = "When this Aura enters, draw a card for each Aura you control that's attached to a creature.";
const PUMP_TEXT = "Enchanted creature gets +1/+1 for each Aura you control that's attached to a creature.";

const YOUR_AURAS_ON_CREATURES = { subtype: "Aura", controlledBy: "you", attachedTo: { type: "creature" } } as const;

// Both count itself once it's on a creature.
export default defineCard({
  name: "Sage's Reverie",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: `Enchant creature\n${ENTER_TEXT}\n${PUMP_TEXT}`,
  targets: ["creature"],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "draw", amount: { countOf: YOUR_AURAS_ON_CREATURES } },
      resolve: null,
      text: ENTER_TEXT,
    },
  ],
  static: [
    {
      affects: { scope: "attached" },
      grantPtPerCount: { filter: YOUR_AURAS_ON_CREATURES, pt: [1, 1] },
      text: PUMP_TEXT,
    },
  ],
});
