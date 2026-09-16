import { defineCard } from "../define.js";

// The +5/+0 rider reads "if a creature is dealt damage this way". Modelled as
// a plain second half of the sequence: `modify-pt` on a player target is a
// no-op, and a creature that died to the damage is gone before it applies —
// which is the same outcome the real card produces.
export default defineCard({
  name: "Provoke the Trolls",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["instant"],
  text:
    "Provoke the Trolls deals 3 damage to any target. If a creature is dealt " +
    "damage this way, it gets +5/+0 until end of turn.",
  targets: ["any-target"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "damage", amount: 3, target: 0 },
      { kind: "modify-pt", target: 0, power: 5, toughness: 0, duration: "end-of-turn" },
    ],
  },
});
