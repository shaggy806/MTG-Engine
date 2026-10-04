import { defineCard } from "../define.js";

// EDHREC rank 4033.
// Makes Insect → new token "Insect Token (Canoptek Scarab Swarm)" (scaffolded).
//
// Rulings:
//   [2022-10-07] If an exiled card is both an artifact card and a land card, you will create one
//     token, not two.

export default defineCard({
  name: "Canoptek Scarab Swarm",
  manaCost: "{4}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Insect"],
  power: 1,
  toughness: 1,
  keywords: ["flying"],
  text: "Flying\nFeeder Mandibles — When this creature enters, exile target player's graveyard. For each artifact or land card exiled this way, create a 1/1 colorless Insect artifact creature token with flying.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["player"],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "exile-graveyard", target: 0 },
          {
            kind: "create-token",
            token: "Insect Token (Canoptek Scarab Swarm)",
            count: { thisWay: "exiled", filter: { typesAnyOf: ["artifact", "land"] } },
          },
        ],
      },
      resolve: null,
      text: "Feeder Mandibles — When this creature enters, exile target player's graveyard. For each artifact or land card exiled this way, create a 1/1 colorless Insect artifact creature token with flying.",
    },
  ],
});
