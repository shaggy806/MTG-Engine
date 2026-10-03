import { defineCard } from "../define.js";
import { equip } from "../helpers.js";

const DIES_TEXT =
  "Whenever equipped creature dies, you may reveal cards from the top of your library until you reveal a " +
  "creature card that shares a creature type with it. Put that card into your hand and the rest on the bottom " +
  "of your library in a random order.";

// "It" is the dead creature as it last existed on the battlefield (the
// ruling) — the trigger object, read through last-known information. One
// with no creature type shares none, so every card is revealed and goes to
// the bottom; a changeling shares one with any creature card that has one.
export default defineCard({
  name: "Heirloom Blade",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: `Equipped creature gets +3/+1.\n${DIES_TEXT}\nEquip {1}`,
  static: [{ affects: { scope: "attached" }, grantPt: [3, 1], text: "Equipped creature gets +3/+1." }],
  triggered: [
    {
      trigger: { on: "dies", who: "attached" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Reveal cards until you reveal a creature card that shares a creature type with it?",
        effect: {
          kind: "reveal-until",
          filter: { type: "creature", sharesCreatureTypeWith: "trigger-object" },
          put: "hand",
          rest: "bottom-random",
        },
      },
      resolve: null,
      text: DIES_TEXT,
    },
  ],
  activated: [equip("{1}")],
});
