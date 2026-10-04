import { defineCard } from "../define.js";

// EDHREC rank 3793.
//
// Rulings:
//   [2025-06-06] Auras attached to the exiled permanent will be put into their owners' graveyards.
//     Any Equipment will become unattached and remain on the battlefield. Any counters on the
//     exiled permanent will cease to exist. When the card returns to the battlefield, it will be a
//     new object with no connection to the card that was exiled.
//   [2025-06-06] If an Aura is exiled this way, its owner chooses what it will enchant as it
//     returns to the battlefield.
//   [2025-06-06] If White Auracite leaves the battlefield before its triggered ability resolves,
//     the target permanent won't be exiled.
//   [2025-06-06] If a token is exiled this way, it will cease to exist and won't return to the
//     battlefield.
//
// Banishing Light's O-Ring shape (rule 610.3c), plus a mana ability.

const ETB = "When this artifact enters, exile target nonland permanent an opponent controls until this artifact leaves the battlefield.";

export default defineCard({
  name: "White Auracite",
  manaCost: "{2}{W}{W}",
  colors: ["W"],
  types: ["artifact"],
  text: `${ETB}\n{T}: Add {W}.`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "W", amount: 1 },
      resolve: null,
      text: "{T}: Add {W}.",
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["nonland-permanent-an-opponent-controls"],
      effect: { kind: "exile", target: 0, untilSourceLeaves: true },
      resolve: null,
      text: ETB,
    },
    {
      trigger: { on: "leaves-battlefield", who: "self" },
      targets: [],
      effect: { kind: "return-exiled-by-source" },
      resolve: null,
      text: "When this artifact leaves the battlefield, return the exiled card.",
    },
  ],
});
