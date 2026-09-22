import { defineCard } from "../define.js";

// Top-commanders rank 422. The one printed ability is a `cast-spell` trigger
// narrowed to its own controller's instants and sorceries (Guttersnipe's
// shape), paying off with a Drake token.
export default defineCard({
  name: "Talrand, Sky Summoner",
  manaCost: "{2}{U}{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Merfolk", "Wizard"],
  power: 2,
  toughness: 2,
  text:
    "Whenever you cast an instant or sorcery spell, create a 2/2 blue Drake " +
    "creature token with flying.",
  triggered: [
    {
      trigger: {
        on: "cast-spell",
        who: "you",
        filter: { typesAnyOf: ["instant", "sorcery"] },
      },
      targets: [],
      effect: { kind: "create-token", token: "Drake Token", count: 1 },
      resolve: null,
      text:
        "Whenever you cast an instant or sorcery spell, create a 2/2 blue Drake " +
        "creature token with flying.",
    },
  ],
});
