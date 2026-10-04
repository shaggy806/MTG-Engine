import { defineCard } from "../define.js";

// EDHREC rank 4323.
//
// Rulings:
//   [2023-02-04] If Ossification leaves the battlefield before its triggered ability resolves, the
//     target permanent won't be exiled.
//   [2023-02-04] Auras attached to the exiled permanent will be put into their owners' graveyards.
//     Any Equipment will become unattached and remain on the battlefield. Any counters on the
//     exiled permanent will cease to exist. When the card returns to the battlefield, it will be a
//     new object with no connection to the card that was exiled.
//   [2023-02-04] If a token is exiled this way, it will cease to exist and won't return to the
//     battlefield.

const EXILE_TEXT =
  "When this Aura enters, exile target creature or planeswalker an opponent controls until this Aura leaves the battlefield.";

/** Sheltered by Ghosts' "exile … until this Aura leaves" shape. */
export default defineCard({
  name: "Ossification",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: `Enchant basic land you control\n${EXILE_TEXT}`,
  targets: [{ kind: "permanent", whose: "you", filter: { type: "land", supertype: "basic" } }],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [{ kind: "permanent", whose: "opponent", filter: { typesAnyOf: ["creature", "planeswalker"] } }],
      effect: { kind: "exile", target: 0, untilSourceLeaves: true },
      resolve: null,
      text: EXILE_TEXT,
    },
    {
      trigger: { on: "leaves-battlefield", who: "self" },
      targets: [],
      effect: { kind: "return-exiled-by-source" },
      resolve: null,
      text: "When this Aura leaves the battlefield, return the exiled card.",
    },
  ],
});
