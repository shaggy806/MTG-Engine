import { defineCard } from "../define.js";

// EDHREC rank 5879.
//
// Rulings:
//   [2025-10-02] If one of these lands enters at the same time as any number of basic lands, those
//     other lands are not counted when determining if this land enters tapped or untapped.

const TAPPED_TEXT = "This land enters tapped unless you control a basic land.";
const TOKEN_TEXT =
  "{3}{B}, {T}: Create a 1/1 colorless Spirit creature token with \"This token can't block or be blocked by non-Spirit creatures.\"";

export default defineCard({
  name: "Realm of Koh",
  colors: [],
  types: ["land"],
  text: `${TAPPED_TEXT}\n{T}: Add {B}.\n${TOKEN_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: {
        event: "enters-battlefield",
        tappedUnless: { kind: "controls", filter: { supertype: "basic", type: "land" }, atLeast: 1 },
      },
      text: TAPPED_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "B", amount: 1 },
      resolve: null,
      text: "{T}: Add {B}.",
    },
    {
      cost: { mana: "{3}{B}", tap: true },
      targets: [],
      effect: { kind: "create-token", token: "Spirit Token (Colorless, Evasive)", count: 1 },
      resolve: null,
      text: TOKEN_TEXT,
    },
  ],
});
