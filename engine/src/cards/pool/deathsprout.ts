import { defineCard } from "../define.js";

export default defineCard({
  name: "Deathsprout",
  manaCost: "{1}{B}{B}{G}",
  colors: ["B", "G"],
  types: ["instant"],
  text: "Destroy target creature. Search your library for a basic land card, put it onto the battlefield tapped, then shuffle.",
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "destroy", target: 0 },
      {
        kind: "search-library",
        filter: { supertype: "basic", type: "land" },
        destination: "battlefield",
        min: 0,
        max: 1,
        enterTapped: true,
      },
    ],
  },
});
