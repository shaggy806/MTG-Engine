import { defineCard } from "../define.js";
import type { EffectSpec } from "../../effects.js";

// EDHREC rank 2841.
//
// Rulings:
//   [2024-07-26] If the top card of your library is a land card, you may choose to put it into
//     your hand rather than onto the battlefield tapped.
//   [2024-07-26] Fecund Greenshell’s last ability checks the power and toughness of a creature
//     only at the moment it enters. If it enters with counters, those counters are included.
//     Static abilities that modify the power and toughness of creatures you control (such as
//     Fecund Greenshell’s own second ability) are also included. If that creature’s toughness is
//     greater than its power when it enters, the ability will still trigger and resolve normally
//     regardless of what happens to that creature after that.
//   [2024-07-26] Damage remains marked on creatures until the turn ends. If Fecund Greenshell’s
//     second ability stops applying (because Fecund Greenshell leaves the battlefield or loses its
//     abilities or because you no longer control ten or more lands), then any creatures that
//     needed the toughness bonus to stay alive will die.

const ANTHEM_TEXT = "As long as you control ten or more lands, creatures you control get +2/+2.";
const ENTER_TEXT =
  "Whenever this creature or another creature you control with toughness greater than its power enters, " +
  "look at the top card of your library. If it's a land card, you may put it onto the battlefield tapped. " +
  "Otherwise, put it into your hand.";

// A land may go onto the battlefield tapped or, declined, to the hand (the
// ruling); anything else goes to the hand — `leftover: "hand"` covers both.
const LOOK: EffectSpec = {
  kind: "look-and-choose",
  zone: "library",
  count: 1,
  min: 0,
  max: 1,
  filter: { type: "land" },
  destination: "battlefield",
  enterTapped: true,
  leftover: "hand",
};

// "This creature or another creature … with toughness greater than its power"
// is two triggers (Vaultborn Tyrant's shape): its own entry, and another's
// with the comparison, read as it enters (the ruling).
export default defineCard({
  name: "Fecund Greenshell",
  manaCost: "{3}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elemental", "Turtle"],
  power: 4,
  toughness: 6,
  keywords: ["reach"],
  text: "Reach\nAs long as you control ten or more lands, creatures you control get +2/+2.\nWhenever this creature or another creature you control with toughness greater than its power enters, look at the top card of your library. If it's a land card, you may put it onto the battlefield tapped. Otherwise, put it into your hand.",
  static: [
    {
      affects: { scope: "creatures-you-control" },
      condition: { kind: "controls", filter: { type: "land" }, atLeast: 10, countsSelf: true },
      grantPt: [2, 2],
      text: ANTHEM_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: LOOK,
      resolve: null,
      text: ENTER_TEXT,
    },
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { type: "creature", toughness: { op: "gt", n: { own: "power" } } },
        otherOnly: true,
      },
      targets: [],
      effect: LOOK,
      resolve: null,
      text: ENTER_TEXT,
    },
  ],
});
