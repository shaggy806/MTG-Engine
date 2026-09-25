import { defineCard } from "../define.js";

// #413 in top-commanders.txt.
const TEXT = "{T}: Each player may draw a card, then each player who drew a card this way gains 1 life.";

export default defineCard({
  name: "Kwain, Itinerant Meddler",
  manaCost: "{W}{U}",
  colors: ["W", "U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Rabbit", "Wizard"],
  power: 1,
  toughness: 3,
  text: TEXT,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: {
        kind: "each-player-may",
        who: "each-player",
        prompt: "Draw a card?",
        effect: { kind: "draw", amount: 1 },
        ifDid: { kind: "gain-life", amount: 1, who: "that-player" },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
