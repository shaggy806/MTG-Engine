import { defineCard } from "../define.js";

/**
 * A modal double-faced card (sorcery // land) — its back face, Volcanic
 * Fissure, is a land you play instead.
 *
 * The search and the blocking rule happen whether or not the land was
 * destroyed (an indestructible land survives), but not at all if the target
 * is illegal as it resolves (the rulings). The rule binds every creature
 * without flying as blockers are declared, one that entered later or lost
 * flying since included (rule 611.2c).
 */
export default defineCard({
  name: "Sundering Eruption",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text:
    "Destroy target land. Its controller may search their library for a basic land card, put it onto the " +
    "battlefield tapped, then shuffle. Creatures without flying can't block this turn.",
  targets: ["land"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "destroy", target: 0 },
      {
        kind: "search-library",
        who: { controllerOfTarget: 0 },
        filter: { type: "land", supertype: "basic" },
        destination: "battlefield",
        min: 0,
        max: 1,
        enterTapped: true,
      },
      {
        kind: "restrict",
        filter: { type: "creature", notKeyword: "flying" },
        restrictions: ["cant-block"],
      },
    ],
  },
  faces: ["Sundering Eruption", "Volcanic Fissure"],
});
