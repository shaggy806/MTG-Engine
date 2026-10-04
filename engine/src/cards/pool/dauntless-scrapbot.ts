import { defineCard } from "../define.js";

// EDHREC rank 5384.

const TEXT = "When this creature enters, exile each opponent's graveyard. Create a Lander token.";

export default defineCard({
  name: "Dauntless Scrapbot",
  manaCost: "{3}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Robot"],
  power: 3,
  toughness: 1,
  text: "When this creature enters, exile each opponent's graveyard. Create a Lander token. (It's an artifact with \"{2}, {T}, Sacrifice this token: Search your library for a basic land card, put it onto the battlefield tapped, then shuffle.\")",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "exile-graveyard", target: "each-opponent" },
          { kind: "create-token", token: "Lander Token", count: 1 },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
