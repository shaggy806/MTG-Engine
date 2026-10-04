import { defineCard } from "../define.js";

// EDHREC rank 6090.
//
// Rulings:
//   [2018-01-19] If an effect refers to a “[subtype] spell” or “[subtype] card,” it refers only to
//     a spell or card that has that subtype. For example, March of the Drowned is a card that
//     benefits Pirates and features Pirates in its illustration, but it isn’t a Pirate card.

const SEARCH_TEXT =
  "When this creature enters, you may search your library for a Vampire card, reveal it, then shuffle and put that card on top.";
const PUMP_TEXT = "Whenever another Vampire you control enters, target creature gets +1/+1 until end of turn.";

export default defineCard({
  name: "Forerunner of the Legion",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Vampire", "Knight"],
  power: 2,
  toughness: 2,
  text: `${SEARCH_TEXT}\n${PUMP_TEXT}`,
  triggered: [
    {
      // Elvish Harbinger's shape.
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Search your library for a Vampire card?",
        effect: {
          kind: "search-library",
          filter: { subtype: "Vampire" },
          destination: "library-top",
          reveal: true,
          min: 0,
          max: 1,
        },
      },
      resolve: null,
      text: SEARCH_TEXT,
    },
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { subtype: "Vampire" },
        otherOnly: true,
      },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: 1, toughness: 1, duration: "end-of-turn" },
      resolve: null,
      text: PUMP_TEXT,
    },
  ],
});
