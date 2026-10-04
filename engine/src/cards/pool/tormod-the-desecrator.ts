import { defineCard } from "../define.js";

// EDHREC rank 3651.
//
// Rulings:
//   [2020-11-10] You create one Zombie token each time Tormod, the Desecrator's ability resolves,
//     no matter how many cards left your graveyard.
//
// "One or more cards leave your graveyard" is the batched `leaves-graveyard`
// trigger (Imotekh the Stormlord's shape, with no filter): once per move,
// however many cards it took.
const LEAVE_TEXT =
  "Whenever one or more cards leave your graveyard, create a tapped 2/2 black Zombie creature token.";

export default defineCard({
  name: "Tormod, the Desecrator",
  manaCost: "{3}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Zombie", "Wizard"],
  power: 4,
  toughness: 2,
  pairing: { kind: "partner" },
  text: `${LEAVE_TEXT}\nPartner (You can have two commanders if both have partner.)`,
  triggered: [
    {
      trigger: { on: "leaves-graveyard", who: "you" },
      targets: [],
      effect: { kind: "create-token", token: "Zombie Token", count: 1, tapped: true },
      resolve: null,
      text: LEAVE_TEXT,
    },
  ],
});
