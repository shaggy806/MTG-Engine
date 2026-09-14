import { defineCard } from "../define.js";

export default defineCard({
  name: "Solemn Simulacrum",
  manaCost: "{4}",
  types: ["artifact", "creature"],
  subtypes: ["Golem"],
  power: 2,
  toughness: 2,
  text:
    "When Solemn Simulacrum enters the battlefield, you may search your library for a basic " +
    "land card, put that card onto the battlefield tapped, then shuffle.\n" +
    "When Solemn Simulacrum dies, you may draw a card.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Search your library for a basic land card?",
        effect: {
          kind: "search-library",
          filter: { type: "land", supertype: "basic" },
          destination: "battlefield",
          min: 0,
          max: 1,
          enterTapped: true,
        },
      },
      resolve: null,
      text:
        "When Solemn Simulacrum enters the battlefield, you may search your library for a " +
        "basic land card, put that card onto the battlefield tapped, then shuffle.",
    },
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Draw a card?",
        effect: { kind: "draw", amount: 1 },
      },
      resolve: null,
      text: "When Solemn Simulacrum dies, you may draw a card.",
    },
  ],
});
