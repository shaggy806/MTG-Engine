import { defineCard } from "../define.js";

const SEARCH_TEXT =
  "Whenever a face-down creature you control enters, you may search your library for a basic land card, reveal it, put it into your hand, then shuffle.";
const PUMP_TEXT = "Whenever a permanent you control is turned face up, if it's a creature, it gets +2/+2 until end of turn.";

// "If it's a creature" is an intervening "if" on the permanent turned face
// up (rule 603.4), asked as it triggers (the trigger's filter) and as it
// resolves (the conditional).
export default defineCard({
  name: "Trail of Mystery",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["enchantment"],
  text: `${SEARCH_TEXT}\n${PUMP_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "creature", faceDown: true } },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Search your library for a basic land card?",
        effect: {
          kind: "search-library",
          filter: { supertype: "basic", type: "land" },
          destination: "hand",
          min: 0,
          max: 1,
          reveal: true,
        },
      },
      resolve: null,
      text: SEARCH_TEXT,
    },
    {
      // The "if" as it triggers (the filter) and again as it resolves (the
      // conditional) — rule 603.4.
      trigger: { on: "turned-face-up", who: "you-control", filter: { type: "creature" } },
      targets: [],
      effect: {
        kind: "conditional",
        condition: { kind: "trigger-object", filter: { type: "creature" } },
        then: { kind: "modify-pt", target: "trigger-object", power: 2, toughness: 2, duration: "end-of-turn" },
      },
      resolve: null,
      text: PUMP_TEXT,
    },
  ],
});
