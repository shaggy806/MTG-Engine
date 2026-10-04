import { defineCard } from "../define.js";

// EDHREC rank 4668.

const UNTAP_TEXT = "{T}: Untap another target permanent you control.";
const TAP_TEXT = "{T}: Tap target permanent. Activate only if you control eight or more lands.";

export default defineCard({
  name: "Kelpie Guide",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Beast"],
  power: 2,
  toughness: 2,
  text: `${UNTAP_TEXT}\n${TAP_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      // Felidar Guardian's "another target permanent you control".
      targets: [{ kind: "other", of: { kind: "permanent", whose: "you", filter: {} } }],
      effect: { kind: "untap", target: 0 },
      resolve: null,
      text: UNTAP_TEXT,
    },
    {
      cost: { mana: null, tap: true },
      condition: { kind: "controls", filter: { type: "land" }, atLeast: 8 },
      targets: ["permanent"],
      effect: { kind: "tap", target: 0 },
      resolve: null,
      text: TAP_TEXT,
    },
  ],
});
