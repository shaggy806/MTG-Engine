import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

// EDHREC rank 5740.
//
// Rulings:
//   [2026-01-27] Once a Ninja or Turtle creature has been blocked, activating Turtle Lair's last
//     ability targeting that creature won't cause it to become unblocked.
//
// The restricted mana is Haven of the Spirit Dragon's `spendOnly` shape (an OR
// of subtypes); the last ability is Access Tunnel's.

const MANA_TEXT = "{T}: Add one mana of any color. Spend this mana only to cast a Ninja or Turtle spell.";
const UNBLOCKABLE_TEXT = "{3}, {T}: Target Ninja or Turtle can't be blocked this turn.";

export default defineCard({
  name: "Turtle Lair",
  colors: [],
  types: ["land"],
  text: `{T}: Add {C}.\n${MANA_TEXT}\n${UNBLOCKABLE_TEXT}`,
  activated: [
    addManaAbility({ mana: "C", text: "{T}: Add {C}." }),
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: {
        kind: "add-mana",
        mana: "any-color",
        amount: 1,
        spendOnly: {
          spell: { subtypes: ["Ninja", "Turtle"] },
          text: "Spend this mana only to cast a Ninja or Turtle spell.",
        },
      },
      resolve: null,
      text: MANA_TEXT,
    },
    {
      cost: { mana: "{3}", tap: true },
      targets: [{ kind: "permanent", filter: { subtypes: ["Ninja", "Turtle"] } }],
      effect: { kind: "grant-keyword", target: 0, keyword: "unblockable", duration: "end-of-turn" },
      resolve: null,
      text: UNBLOCKABLE_TEXT,
    },
  ],
});
