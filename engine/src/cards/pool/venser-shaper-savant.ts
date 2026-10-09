import { defineCard } from "../define.js";

// Sink into Stupor's one `spell-or-permanent` slot, any controller and any
// permanent (lands too): of the two returns only the one from the zone the
// target is in does anything. A spell returned isn't countered, so it works
// on one that can't be; a flashed-back spell is exiled instead (rule
// 702.34a); a copy of a spell ceases to exist (rule 707.10a) — its rulings.
const ENTER_TEXT = "When Venser enters, return target spell or permanent to its owner's hand.";

export default defineCard({
  name: "Venser, Shaper Savant",
  manaCost: "{2}{U}{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 2,
  toughness: 2,
  keywords: ["flash"],
  text: `Flash\n${ENTER_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [{ kind: "spell-or-permanent" }],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "return-to-hand", target: 0, from: "stack" },
          { kind: "return-to-hand", target: 0 },
        ],
      },
      resolve: null,
      text: ENTER_TEXT,
    },
  ],
});
