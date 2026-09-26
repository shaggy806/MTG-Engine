import { defineCard } from "../define.js";

const SPELL_MODE = "Return target spell you don't control to its owner's hand.";
const PERMANENT_MODE = "Return target nonland permanent to its owner's hand.";
const TRIGGER_TEXT = "Whenever you cast a spell, choose up to one —";

// The modes are announced as the ability goes on the stack (rule 603.3c),
// each with its own target; one with nothing to point at can't be chosen.
export default defineCard({
  name: "Hullbreaker Horror",
  manaCost: "{5}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Kraken", "Horror"],
  power: 7,
  toughness: 8,
  keywords: ["flash"],
  cantBeCountered: true,
  text: `Flash\nThis spell can't be countered.\n${TRIGGER_TEXT}\n• ${SPELL_MODE}\n• ${PERMANENT_MODE}`,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you" },
      targets: [],
      effect: {
        kind: "modal",
        announced: true,
        minModes: 0,
        maxModes: 1,
        modes: [
          {
            text: SPELL_MODE,
            targets: [{ kind: "spell", whose: "opponent", filter: {} }],
            effect: { kind: "return-to-hand", target: 0, from: "stack" },
          },
          {
            text: PERMANENT_MODE,
            targets: ["nonland-permanent"],
            effect: { kind: "return-to-hand", target: 0 },
          },
        ],
      },
      resolve: null,
      text: `${TRIGGER_TEXT} ${SPELL_MODE} ${PERMANENT_MODE}`,
    },
  ],
});
