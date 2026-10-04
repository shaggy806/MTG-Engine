import { defineCard } from "../define.js";

// EDHREC rank 2592.
//
// Rulings:
//   [2020-11-10] If either target is an illegal target as Soul's Fire resolves, no damage is
//     dealt.

export default defineCard({
  name: "Soul's Fire",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["instant"],
  text: "Target creature you control deals damage equal to its power to any target.",
  targets: ["creature-you-control", "any-target"],
  // The creature deals it (Chandra's Ignition's `from`): a blank slot — an
  // illegal target, either one — deals nothing (the ruling).
  effect: { kind: "damage", amount: { powerOf: 0 }, target: 1, from: { target: 0 } },
});
