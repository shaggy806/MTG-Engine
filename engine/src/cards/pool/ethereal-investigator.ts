import { defineCard } from "../define.js";
import { investigate } from "../helpers.js";

// EDHREC rank 4116.
// Makes Clue → "Clue Token"; Spirit → "Spirit Token" (1/1 white, flying).

const ENTER_TEXT =
  "When this creature enters, investigate X times, where X is the number of opponents you have.";
const DRAW_TEXT = "Whenever you draw your second card each turn, create a 1/1 white Spirit creature token with flying.";

export default defineCard({
  name: "Ethereal Investigator",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Spirit"],
  power: 2,
  toughness: 3,
  keywords: ["flying"],
  text: `Flying\n${ENTER_TEXT} (To investigate, create a Clue token. It's an artifact with "{2}, Sacrifice this token: Draw a card.")\n${DRAW_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: investigate({ countPlayers: "each-opponent" }),
      resolve: null,
      text: ENTER_TEXT,
    },
    {
      // Alandra, Sky Dreamer's shape.
      trigger: { on: "draws", who: "you", nthEachTurn: 2 },
      targets: [],
      effect: { kind: "create-token", token: "Spirit Token", count: 1 },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
});
