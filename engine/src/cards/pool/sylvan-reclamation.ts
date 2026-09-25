import { defineCard } from "../define.js";
import { distinctTargets } from "../helpers.js";

export default defineCard({
  name: "Sylvan Reclamation",
  manaCost: "{3}{G}{W}",
  colors: ["G", "W"],
  types: ["instant"],
  text:
    "Exile up to two target artifacts and/or enchantments.\n" +
    "Basic landcycling {2}",
  targets: distinctTargets(2, "artifact-or-enchantment", { optional: true }),
  effect: {
    kind: "sequence",
    effects: [
      { kind: "exile", target: 0 },
      { kind: "exile", target: 1 },
    ],
  },
  // Basic landcycling: the same discard-to-search shape as plain cycling,
  // with the search narrowed to a basic land rather than drawing a card.
  cycling: { cost: "{2}", search: { type: "land", supertype: "basic" } },
});
