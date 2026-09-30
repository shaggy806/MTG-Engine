import { defineCard } from "../define.js";

const TEXT =
  "When this land enters, sacrifice it. When you do, search your library for a basic Plains, Island, or Swamp card, put it onto the battlefield tapped, then shuffle and you gain 1 life.";

// "When you do" is a reflexive trigger (rule 603.12): only a sacrifice that
// happened triggers it, so a land that left in response fetches nothing.
export default defineCard({
  name: "Obscura Storefront",
  types: ["land"],
  text: TEXT,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "sacrifice-source",
        then: {
          kind: "reflexive-trigger",
          targets: [],
          effect: {
            kind: "sequence",
            effects: [
              {
                kind: "search-library",
                filter: { supertype: "basic", subtypes: ["Plains", "Island", "Swamp"] },
                destination: "battlefield",
                enterTapped: true,
                min: 0,
                max: 1,
              },
              { kind: "gain-life", amount: 1 },
            ],
          },
          text: "Search your library for a basic Plains, Island, or Swamp card, put it onto the battlefield tapped, then shuffle and you gain 1 life.",
        },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
