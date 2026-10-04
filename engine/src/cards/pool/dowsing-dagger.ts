import { defineCard } from "../define.js";
import { equip } from "../helpers.js";

// EDHREC rank 2394. The Plants are created under the targeted opponent's
// control (`who: "target-controller"` reads a player target as that player).
// Transformed into Lost Vale — a land — it falls off its creature as a
// state-based action (rule 704.5p), and a second combat-damage trigger (double
// strike) can't turn it back: an ability of a permanent transforms it only if
// it hasn't transformed since the ability went on the stack (rule 701.27f).
//
// Rulings:
//   [2017-09-29] Attacking with an equipped creature doesn't cause Equipment attached to it to
//     become tapped. Dowsing Dagger will normally be untapped when it transforms into Lost Vale.

const ENTER_TEXT =
  "When this Equipment enters, target opponent creates two 0/2 green Plant creature tokens with defender.";
const TRANSFORM_TEXT = "Whenever equipped creature deals combat damage to a player, you may transform this Equipment.";

export default defineCard({
  name: "Dowsing Dagger",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: `${ENTER_TEXT}\nEquipped creature gets +2/+1.\n${TRANSFORM_TEXT}\nEquip {2}`,
  activated: [equip("{2}")],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["opponent"],
      effect: {
        kind: "create-token",
        token: "Plant Token (Defender)",
        count: 2,
        who: "target-controller",
      },
      resolve: null,
      text: ENTER_TEXT,
    },
    {
      trigger: { on: "deals-combat-damage-to-player", who: "attached" },
      targets: [],
      effect: { kind: "may", prompt: "Transform Dowsing Dagger?", effect: { kind: "transform", target: "source" } },
      resolve: null,
      text: TRANSFORM_TEXT,
    },
  ],
  static: [{ affects: { scope: "attached" }, grantPt: [2, 1], text: "Equipped creature gets +2/+1." }],
  faces: ["Dowsing Dagger", "Lost Vale"],
  transform: true,
});
