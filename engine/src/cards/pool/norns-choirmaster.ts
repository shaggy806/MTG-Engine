import { defineCard } from "../define.js";

// EDHREC rank 3389.
//
// Rulings:
//   [2023-02-04] You don't have to choose every permanent or player that has a counter, only the
//     ones you want to add another counter to.
//   [2023-02-04] An ability that triggers "Whenever you proliferate" triggers even if you chose no
//     permanents or players while doing so.

const TEXT =
  "Whenever a commander you control enters or attacks, proliferate. (Choose any number of permanents and/or players, then give each another counter of each kind already there.)";
const COMMANDER = { isCommander: true } as const;

export default defineCard({
  name: "Norn's Choirmaster",
  manaCost: "{3}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Phyrexian", "Angel"],
  power: 5,
  toughness: 4,
  keywords: ["flying", "first-strike"],
  text: `Flying, first strike\n${TEXT}`,
  // Tome of Legends' pair of triggers, on a commander you control.
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: COMMANDER },
      targets: [],
      effect: { kind: "proliferate" },
      resolve: null,
      text: TEXT,
    },
    {
      trigger: { on: "attacks", who: "you-control", filter: COMMANDER },
      targets: [],
      effect: { kind: "proliferate" },
      resolve: null,
      text: TEXT,
    },
  ],
});
