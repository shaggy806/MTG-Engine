import { defineCard } from "../define.js";

// The rulings this follows: creatures entering together each trigger the
// scry, one at a time; the draw triggers once for a spell with at least one
// creature you control among its targets, however many it targets, and
// resolves even if that spell is countered.
const SCRY_TEXT = "Whenever a creature you control enters, scry 1.";
const DRAW_TEXT = "Whenever you cast a spell that targets a creature you control, draw a card.";

export default defineCard({
  name: "Season of Growth",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["enchantment"],
  text:
    `${SCRY_TEXT} (Look at the top card of your library. You may put that card on the bottom.)\n` +
    DRAW_TEXT,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "creature" } },
      targets: [],
      effect: { kind: "scry", amount: 1 },
      resolve: null,
      text: SCRY_TEXT,
    },
    {
      trigger: {
        on: "cast-spell",
        who: "you",
        filter: { targets: { permanent: { type: "creature", controlledBy: "you" } } },
      },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
});
