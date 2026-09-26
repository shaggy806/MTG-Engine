import { defineCard } from "../define.js";

const TEXT = "When this creature enters, untap up to two lands.";

// The lands are chosen as the ability resolves, any player's — not targets
// (the ruling).
export default defineCard({
  name: "Cloud of Faeries",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Faerie"],
  power: 1,
  toughness: 1,
  keywords: ["flying"],
  text: `Flying\n${TEXT}\nCycling {2} ({2}, Discard this card: Draw a card.)`,
  cycling: { cost: "{2}" },
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "choose-permanents",
        filter: { type: "land" },
        upTo: 2,
        then: { kind: "untap", target: 0 },
        prompt: "Untap up to two lands",
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
