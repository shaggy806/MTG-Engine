import { defineCard } from "../define.js";

// EDHREC rank 6451.
// Makes "Treasure Token".

export default defineCard({
  name: "Mastermind Plum",
  manaCost: "{2}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 2,
  toughness: 2,
  text: "Whenever Mastermind Plum attacks, exile up to one target card from a graveyard. If an artifact card was exiled this way, create a Treasure token. (It's an artifact with \"{T}, Sacrifice this token: Add one mana of any color.\")\nWhenever you cast a spell, if mana from a Treasure was spent to cast it, you draw a card and you lose 1 life.",
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [{ kind: "optional", of: { kind: "card-in-graveyard" } }],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "exile", target: 0 },
          {
            kind: "conditional",
            condition: { kind: "this-way", what: "exiled", filter: { type: "artifact" } },
            then: { kind: "create-token", token: "Treasure Token", count: 1 },
          },
        ],
      },
      resolve: null,
      text: "Whenever Mastermind Plum attacks, exile up to one target card from a graveyard. If an artifact card was exiled this way, create a Treasure token.",
    },
    {
      // Inga and Esika's `manaFrom` clause: what was spent never changes, so
      // the intervening-if reads the same as it resolves.
      trigger: { on: "cast-spell", who: "you", filter: { manaFrom: { subtype: "Treasure" } } },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "draw", amount: 1 },
          { kind: "lose-life", amount: 1 },
        ],
      },
      resolve: null,
      text: "Whenever you cast a spell, if mana from a Treasure was spent to cast it, you draw a card and you lose 1 life.",
    },
  ],
});
