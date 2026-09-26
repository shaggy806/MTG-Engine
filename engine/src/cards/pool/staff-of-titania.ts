import { defineCard } from "../define.js";
import { equip } from "../helpers.js";

const ATTACK_TEXT = "Whenever equipped creature attacks, create a 1/1 green Forest Dryad land creature token.";

// The Dryads are Forests themselves, so each one grows the equipped creature.
export default defineCard({
  name: "Staff of Titania",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text:
    "Equipped creature gets +X/+X, where X is the number of Forests you control.\n" +
    `${ATTACK_TEXT} (It's affected by summoning sickness.)\nEquip {3}`,
  static: [
    {
      affects: { scope: "attached" },
      grantPtPerCount: { filter: { subtype: "Forest", controlledBy: "you" }, pt: [1, 1] },
      text: "Equipped creature gets +X/+X, where X is the number of Forests you control.",
    },
  ],
  triggered: [
    {
      trigger: { on: "attacks", who: "attached" },
      targets: [],
      effect: { kind: "create-token", token: "Forest Dryad Token", count: 1 },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
  activated: [equip("{3}")],
});
