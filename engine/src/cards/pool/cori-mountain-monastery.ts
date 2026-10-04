import { defineCard } from "../define.js";

// EDHREC rank 3541.
//
// Rulings:
//   [2025-04-04] You pay all costs and follow all timing rules for cards played this way. For
//     example, if the exiled card is a land card, you may play it only during your main phase
//     while the stack is empty.
//   [2025-04-04] You must already control a Plains or Island as Cori Mountain Monastery enters for
//     it to enter untapped. If it enters at the same time as a Plains or Island when you control
//     no other Plains or Islands, it will enter tapped.

const TAPPED_TEXT = "This land enters tapped unless you control a Plains or an Island.";
const IMPULSE_TEXT =
  "{3}{R}, {T}: Exile the top card of your library. Until the end of your next turn, you may play that card.";

export default defineCard({
  name: "Cori Mountain Monastery",
  colors: [],
  types: ["land"],
  text: `${TAPPED_TEXT}\n{T}: Add {R}.\n${IMPULSE_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: {
        event: "enters-battlefield",
        tappedUnless: { kind: "controls", filter: { subtypes: ["Plains", "Island"] }, atLeast: 1 },
      },
      text: TAPPED_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "R", amount: 1 },
      resolve: null,
      text: "{T}: Add {R}.",
    },
    {
      cost: { mana: "{3}{R}", tap: true },
      targets: [],
      effect: { kind: "impulse-exile", amount: 1, duration: "your-next-turn" },
      resolve: null,
      text: IMPULSE_TEXT,
    },
  ],
});
