import { defineCard } from "../define.js";

// The back face of Esika, God of the Tree.
const TRIGGER_TEXT =
  "At the beginning of your upkeep, reveal cards from the top of your library until you reveal a " +
  "creature or planeswalker card. Put that card onto the battlefield and the rest on the bottom of " +
  "your library in a random order.";

export default defineCard({
  name: "The Prismatic Bridge",
  art: "https://cards.scryfall.io/art_crop/back/f/6/f6cd7465-9dd0-473c-ac5e-dd9e2f22f5f6.jpg",
  manaCost: "{W}{U}{B}{R}{G}",
  colors: ["W", "U", "B", "R", "G"],
  supertypes: ["legendary"],
  types: ["enchantment"],
  text: TRIGGER_TEXT,
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: {
        kind: "reveal-until",
        filter: { typesAnyOf: ["creature", "planeswalker"] },
        put: "battlefield",
        rest: "bottom-random",
      },
      resolve: null,
      text: TRIGGER_TEXT,
    },
  ],
  faces: ["Esika, God of the Tree", "The Prismatic Bridge"],
});
