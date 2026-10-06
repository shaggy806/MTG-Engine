import { defineCard } from "../define.js";

// EDHREC rank 6477.
//
// Rulings:
//   [2025-10-02] The controller of the destroyed artifact or land isn't required to search their
//     library. If that player doesn't, the player won't shuffle their library.
//
// Erode's shape: the controller may search whether or not the permanent was
// destroyed (an indestructible one), as the card says nothing else.
export default defineCard({
  name: "Price of Freedom",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["sorcery"],
  subtypes: ["Lesson"],
  text:
    "Destroy target artifact or land an opponent controls. Its controller may search their library for a basic land card, put it onto the battlefield tapped, then shuffle.\nDraw a card.",
  targets: [{ kind: "permanent", filter: { typesAnyOf: ["artifact", "land"], controlledBy: "opponent" } }],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "destroy", target: 0 },
      {
        kind: "search-library",
        filter: { type: "land", supertype: "basic" },
        destination: "battlefield",
        enterTapped: true,
        min: 0,
        max: 1,
        who: { controllerOfTarget: 0 },
      },
      { kind: "draw", amount: 1 },
    ],
  },
});
