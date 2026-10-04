import { defineCard } from "../define.js";

// EDHREC rank 5396.
//
// Rulings:
//   [2019-08-23] Scaretiller's ability is a triggered ability, not an activated ability. It
//     doesn't allow you to tap it whenever you want; rather, you need some other way of tapping
//     it, such as by attacking.
//   [2019-08-23] If Scaretiller becomes tapped while casting a spell or activating an ability,
//     that spell or ability resolves after Scaretiller's triggered ability has resolved.
//   [2019-08-23] Neither mode of Scaretiller's ability counts as playing a land. It can put a land
//     card onto the battlefield even if you've already played your land for the turn, and even if
//     it's not your turn.
// A modal triggered ability: its mode (and the second mode's target) is
// chosen as it goes on the stack (`announced`).

const TRIGGER_TEXT = "Whenever this creature becomes tapped, choose one —";
const HAND_MODE = "You may put a land card from your hand onto the battlefield tapped.";
const GRAVEYARD_MODE = "Return target land card from your graveyard to the battlefield tapped.";

export default defineCard({
  name: "Scaretiller",
  manaCost: "{4}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Scarecrow"],
  power: 1,
  toughness: 4,
  text: `${TRIGGER_TEXT}\n• ${HAND_MODE}\n• ${GRAVEYARD_MODE}`,
  triggered: [
    {
      trigger: { on: "becomes-tapped", who: "self" },
      targets: [],
      effect: {
        kind: "modal",
        announced: true,
        minModes: 1,
        maxModes: 1,
        modes: [
          {
            text: HAND_MODE,
            effect: {
              kind: "look-and-choose",
              zone: "hand",
              min: 0,
              max: 1,
              destination: "battlefield",
              enterTapped: true,
              leftover: "stay",
              filter: { type: "land" },
            },
          },
          {
            text: GRAVEYARD_MODE,
            targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "land" } }],
            effect: { kind: "put-onto-battlefield", target: 0, enterTapped: true },
          },
        ],
      },
      resolve: null,
      text: `${TRIGGER_TEXT} ${HAND_MODE} ${GRAVEYARD_MODE}`,
    },
  ],
});
