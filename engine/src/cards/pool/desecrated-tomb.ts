import { defineCard } from "../define.js";

// EDHREC rank 4398.
//
// Rulings:
//   [2018-07-13] You create one Bat token each time Desecrated Tomb's ability triggers, no matter
//     how many cards left your graveyard.

const TEXT =
  "Whenever one or more creature cards leave your graveyard, create a 1/1 black Bat creature token with flying.";

export default defineCard({
  name: "Desecrated Tomb",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: TEXT,
  triggered: [
    {
      trigger: { on: "leaves-graveyard", who: "you", filter: { type: "creature" } },
      targets: [],
      effect: { kind: "create-token", token: "Bat Token", count: 1 },
      resolve: null,
      text: TEXT,
    },
  ],
});
