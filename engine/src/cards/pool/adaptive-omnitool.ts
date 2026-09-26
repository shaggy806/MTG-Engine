import { defineCard } from "../define.js";
import { equip } from "../helpers.js";

const ATTACK_TEXT =
  "Whenever equipped creature attacks, look at the top six cards of your library. You may reveal an artifact card from among them and put it into your hand. Put the rest on the bottom of your library in a random order.";

export default defineCard({
  name: "Adaptive Omnitool",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: `Equipped creature gets +1/+1 for each artifact you control.\n${ATTACK_TEXT}\nEquip {3}`,
  static: [
    {
      affects: { scope: "attached" },
      grantPtPerCount: { filter: { type: "artifact", controlledBy: "you" }, pt: [1, 1] },
      text: "Equipped creature gets +1/+1 for each artifact you control.",
    },
  ],
  triggered: [
    {
      trigger: { on: "attacks", who: "attached" },
      targets: [],
      effect: {
        kind: "look-and-choose",
        zone: "library",
        count: 6,
        reveal: true,
        min: 0,
        max: 1,
        filter: { type: "artifact" },
        destination: "hand",
        leftover: "bottom-random",
      },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
  activated: [equip("{3}")],
});
