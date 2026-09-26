import { defineCard } from "../define.js";

const TEXT = "When this creature enters, untap up to five lands.";

// The lands are chosen as the ability resolves, any player's — not targets.
export default defineCard({
  name: "Peregrine Drake",
  manaCost: "{4}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Drake"],
  power: 2,
  toughness: 3,
  keywords: ["flying"],
  text: `Flying\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "choose-permanents",
        filter: { type: "land" },
        upTo: 5,
        then: { kind: "untap", target: 0 },
        prompt: "Untap up to five lands",
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
