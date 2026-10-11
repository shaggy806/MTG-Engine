import { defineCard } from "../define.js";

// EDHREC rank 6737.

const ENTER_TEXT = "When this enchantment enters, draw two cards.";
const OTHERS_TEXT = "At the beginning of each other player's draw step, that player draws an additional card.";
const YOURS_TEXT = "At the beginning of your draw step, draw two additional cards.";

// "Each other player" is each opponent in a free-for-all game: the
// `step-begins` trigger's `"opponent"` fires once on each opponent's draw
// step, and the drawing player is that turn's active player (Dictate of
// Kruphix's shape). Your own draw step is Sarkhan, the Dragonspeaker's.
export default defineCard({
  name: "Well of Ideas",
  manaCost: "{5}{U}",
  colors: ["U"],
  types: ["enchantment"],
  text: `${ENTER_TEXT}\n${OTHERS_TEXT}\n${YOURS_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "draw", amount: 2 },
      resolve: null,
      text: ENTER_TEXT,
    },
    {
      trigger: { on: "step-begins", step: "draw", who: "opponent" },
      targets: [],
      effect: { kind: "draw", amount: 1, who: "active-player" },
      resolve: null,
      text: OTHERS_TEXT,
    },
    {
      trigger: { on: "step-begins", step: "draw", who: "you" },
      targets: [],
      effect: { kind: "draw", amount: 2 },
      resolve: null,
      text: YOURS_TEXT,
    },
  ],
});
