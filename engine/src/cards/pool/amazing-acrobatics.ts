import { defineCard } from "../define.js";

// EDHREC rank 4192.

const COUNTER_MODE = "Counter target spell.";
const TAP_MODE = "Tap one or two target creatures.";

export default defineCard({
  name: "Amazing Acrobatics",
  manaCost: "{1}{U}{U}",
  colors: ["U"],
  types: ["instant"],
  text: `Choose one or both —\n• ${COUNTER_MODE}\n• ${TAP_MODE}`,
  castModal: {
    minModes: 1,
    maxModes: 2,
    modes: [
      {
        text: COUNTER_MODE,
        targets: ["spell"],
        effect: { kind: "counter", target: 0 },
      },
      {
        text: TAP_MODE,
        // One or two: a first creature, then up to one other (Archenemy's
        // Charm's "one or two target … cards" shape).
        targets: ["creature", { kind: "optional", of: { kind: "other", of: "creature", than: { slot: 0 } } }],
        effect: {
          kind: "sequence",
          effects: [
            { kind: "tap", target: 0 },
            { kind: "tap", target: 1 },
          ],
        },
      },
    ],
  },
});
