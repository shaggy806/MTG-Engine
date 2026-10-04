import { defineCard } from "../define.js";

// EDHREC rank 5466.
//
// Rulings:
//   [2025-01-24] The ability that defines Splinterfright’s power and toughness works in all zones,
//     not just the battlefield. If Splinterfright is in your graveyard, it will count itself.
//   [2025-01-24] The ability that defines Splinterfright’s power and toughness works in all zones,
//     not just the battlefield. If Splinterfright is in your graveyard, it will count itself.
//   [2025-01-24] If Splinterfright’s controller has only one card in their library when its
//     triggered ability resolves, they put that card into their graveyard.
//   [2025-01-24] If Splinterfright’s controller has only one card in their library when its
//     triggered ability resolves, they put that card into their graveyard.

const CDA_TEXT =
  "Splinterfright's power and toughness are each equal to the number of creature cards in your graveyard.";

export default defineCard({
  name: "Splinterfright",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elemental"],
  power: 0,
  toughness: 0,
  keywords: ["trample"],
  text: `Trample\n${CDA_TEXT}\nAt the beginning of your upkeep, mill two cards. (Put the top two cards of your library into your graveyard.)`,
  static: [
    {
      affects: { scope: "self" },
      setBasePtFromCount: {
        countOf: { countInGraveyard: { type: "creature", ownedBy: "you" } },
        plusPower: 0,
        plusToughness: 0,
      },
      text: CDA_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: { kind: "mill", target: "you", amount: 2 },
      resolve: null,
      text: "At the beginning of your upkeep, mill two cards.",
    },
  ],
});
