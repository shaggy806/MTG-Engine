import { defineCard } from "../define.js";
import { equip } from "../helpers.js";

// EDHREC rank 3139.
//
// Rulings:
//   [2021-09-24] You must pay exactly X life or nothing. You can't pay less life to draw fewer
//     cards.
//   [2021-09-24] Use the equipped creature's power as it last existed on the battlefield to
//     determine the value of X. (`powerOf: "trigger-object"` reads the dead creature's last-known
//     power.)

const STATIC_TEXT = "Equipped creature has flying and lifelink.";
const DIES_TEXT =
  "Whenever equipped creature dies, you may pay X life, where X is its power. If you do, draw X cards.";
const X = { powerOf: "trigger-object" } as const;

export default defineCard({
  name: "Mask of Griselbrand",
  manaCost: "{1}{B}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: `${STATIC_TEXT}\n${DIES_TEXT}\nEquip {3}`,
  static: [
    {
      affects: { scope: "attached" },
      grantKeywords: ["flying", "lifelink"],
      text: STATIC_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "dies", who: "attached" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Pay X life (X = its power) to draw X cards?",
        costLife: X,
        effect: { kind: "draw", amount: X },
      },
      resolve: null,
      text: DIES_TEXT,
    },
  ],
  activated: [equip("{3}")],
});
