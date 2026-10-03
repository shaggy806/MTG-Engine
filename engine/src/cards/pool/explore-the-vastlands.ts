import { defineCard } from "../define.js";

const TEXT =
  "Each player looks at the top five cards of their library and may reveal a land card and/or an instant or " +
  "sorcery card from among them. Each player puts the cards they revealed this way into their hand and the rest " +
  "on the bottom of their library in a random order. Each player gains 3 life.";

// The back face of Wandering Archaic. Each player in turn, the active player
// first, chooses knowing what the players before them revealed (the ruling):
// a land card, then an instant or sorcery card, each optional and revealed as
// it's taken; the rest go to the bottom in a random order. Everyone gains 3
// life, whether they revealed anything or not.
export default defineCard({
  name: "Explore the Vastlands",
  art: "https://cards.scryfall.io/art_crop/back/1/8/18a2bdc8-b705-4eb5-b3a5-ff2e2ab8f312.jpg",
  manaCost: "{3}",
  colors: [],
  types: ["sorcery"],
  text: TEXT,
  effect: {
    kind: "sequence",
    effects: [
      {
        kind: "for-each-player",
        who: "each-player",
        effect: {
          kind: "look-and-choose",
          player: "that-player",
          zone: "library",
          count: 5,
          min: 0,
          max: 1,
          filter: { type: "land" },
          destination: "hand",
          reveal: "chosen",
          secondPick: { filter: { typesAnyOf: ["instant", "sorcery"] }, min: 0, max: 1, destination: "hand" },
          leftover: "bottom-random",
        },
      },
      { kind: "gain-life", amount: 3, who: "each-player" },
    ],
  },
  faces: ["Wandering Archaic", "Explore the Vastlands"],
});
