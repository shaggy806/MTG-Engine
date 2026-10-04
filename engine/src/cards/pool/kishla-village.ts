import { defineCard } from "../define.js";

// EDHREC rank 4889.
//
// Rulings:
//   [2025-04-04] You must already control an Island or a Swamp as Kishla Village enters for it to
//     enter untapped. If it enters at the same time as an Island or Swamp when you control no
//     other Islands or Swamps, it will enter tapped.

const TAPPED_TEXT = "This land enters tapped unless you control an Island or a Swamp.";
const SURVEIL_TEXT =
  "{3}{G}, {T}: Surveil 2. (Look at the top two cards of your library, then put any number of them into your graveyard and the rest on top of your library in any order.)";

// Cori Mountain Monastery's shape.
export default defineCard({
  name: "Kishla Village",
  colors: [],
  types: ["land"],
  text: `${TAPPED_TEXT}\n{T}: Add {G}.\n${SURVEIL_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: {
        event: "enters-battlefield",
        tappedUnless: { kind: "controls", filter: { subtypes: ["Island", "Swamp"] }, atLeast: 1 },
      },
      text: TAPPED_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "G", amount: 1 },
      resolve: null,
      text: "{T}: Add {G}.",
    },
    {
      cost: { mana: "{3}{G}", tap: true },
      targets: [],
      effect: { kind: "surveil", amount: 2 },
      resolve: null,
      text: "{3}{G}, {T}: Surveil 2.",
    },
  ],
});
