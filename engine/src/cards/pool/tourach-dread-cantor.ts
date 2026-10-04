import { defineCard } from "../define.js";

// EDHREC rank 6165.
//
// Rulings:
//   [2021-06-18] Triggered abilities are put on the stack in turn order, starting with the player
//     whose turn it is. For example, if an opponent discards a card with madness during your turn,
//     the madness trigger will resolve before Tourach's ability can put a +1/+1 counter on it. If
//     they discard it during their turn, Tourach's ability puts a +1/+1 counter on it before they
//     can cast the spell.
//   [2024-11-08] If a card or token enters as a copy of a permanent, the new permanent isn't
//     kicked, even if the original was.
//   [2024-11-08] If you put a permanent with a kicker ability onto the battlefield without casting
//     it, you can't kick it.

const DISCARD_TEXT = "Whenever an opponent discards a card, put a +1/+1 counter on Tourach.";
const KICKED_TEXT = "When Tourach enters, if it was kicked, target opponent discards two cards at random.";

export default defineCard({
  name: "Tourach, Dread Cantor",
  manaCost: "{1}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Cleric"],
  power: 2,
  toughness: 1,
  text: `Kicker {B}{B} (You may pay an additional {B}{B} as you cast this spell.)\nProtection from white\n${DISCARD_TEXT}\n${KICKED_TEXT}`,
  kicker: { cost: "{B}{B}" },
  triggered: [
    {
      trigger: { on: "discards", who: "opponent", perCard: true },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: DISCARD_TEXT,
    },
    {
      // Nullpriest of Oblivion's shape.
      trigger: { on: "enters-battlefield", who: "self" },
      condition: { kind: "self-kicked" },
      targets: ["opponent"],
      effect: { kind: "discard", target: 0, amount: 2, random: true },
      resolve: null,
      text: KICKED_TEXT,
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      protection: { colors: ["W"] },
      text: "Protection from white",
    },
  ],
});
