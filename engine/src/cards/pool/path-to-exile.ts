import { defineCard } from "../define.js";

// Exile first, then the land — the printed order. `controllerOfTarget` reads
// last-known information (rule 608.2h), so the creature's controller is still
// named after it has gone.
export default defineCard({
  name: "Path to Exile",
  manaCost: "{W}",
  colors: ["W"],
  types: ["instant"],
  text:
    "Exile target creature. Its controller may search their library for a basic " +
    "land card, put that card onto the battlefield tapped, then shuffle.",
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "exile", target: 0 },
      {
        kind: "search-library",
        who: { controllerOfTarget: 0 },
        filter: { type: "land", supertype: "basic" },
        destination: "battlefield",
        // "**May** search" — `min: 0` is what makes it optional.
        min: 0,
        max: 1,
        enterTapped: true,
      },
    ],
  },
});
