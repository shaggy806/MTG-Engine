import { defineCard } from "../define.js";
import { annihilator } from "../helpers.js";

// EDHREC rank 3456.
//
// Rulings:
//   [2010-06-15] Annihilator abilities trigger and resolve during the declare attackers step. The
//     defending player chooses and sacrifices the required number of permanents before they
//     declare blockers. Any creatures sacrificed this way won't be able to block.
//   [2018-12-07] If Ulamog's Crusher can't attack for any reason (such as becoming tapped or
//     having just entered the battlefield), then it doesn't attack.

export default defineCard({
  name: "Ulamog's Crusher",
  manaCost: "{8}",
  colors: [],
  types: ["creature"],
  subtypes: ["Eldrazi"],
  power: 8,
  toughness: 8,
  text: "Annihilator 2 (Whenever this creature attacks, defending player sacrifices two permanents of their choice.)\nThis creature attacks each combat if able.",
  triggered: [annihilator(2)],
  static: [
    {
      affects: { scope: "self" },
      restrictions: ["must-attack"],
      text: "This creature attacks each combat if able.",
    },
  ],
});
