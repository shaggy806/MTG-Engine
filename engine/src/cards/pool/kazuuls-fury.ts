import { defineCard } from "../define.js";

/** A modal double-faced card (instant // land) — its back face, Kazuul's
 * Cliffs, is a land you play instead. Fling's front. */
export default defineCard({
  name: "Kazuul's Fury",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["instant"],
  text:
    "As an additional cost to cast this spell, sacrifice a creature.\n" +
    "Kazuul's Fury deals damage equal to the sacrificed creature's power to any target.",
  additionalCost: { sacrifice: { type: "creature", controlledBy: "you" } },
  targets: ["any-target"],
  effect: { kind: "damage", target: 0, amount: { powerOf: "sacrificed" } },
  faces: ["Kazuul's Fury", "Kazuul's Cliffs"],
});
