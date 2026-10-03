import { defineCard } from "../define.js";

// "If you do" is the sacrifice actually made: the permanent sacrificed in
// answer is the follow-up's "sacrificed", so "shares a card type with it"
// reads its types as it last existed — any one of them, for an artifact
// creature (the ruling). Each opponent is asked in turn; one who doesn't
// (or can't) sacrifice loses 2 life, and you draw a card for each.
const TEXT =
  "At the beginning of your end step, you may sacrifice an artifact, creature, enchantment, land, or " +
  "planeswalker. If you do, each opponent may sacrifice a permanent of their choice that shares a card " +
  "type with it. For each opponent who doesn't, that player loses 2 life and you draw a card.";

export default defineCard({
  name: "Braids, Arisen Nightmare",
  manaCost: "{1}{B}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Nightmare"],
  power: 3,
  toughness: 3,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      targets: [],
      effect: {
        kind: "each-player-may",
        who: "you",
        options: [
          {
            sacrifice: { typesAnyOf: ["artifact", "creature", "enchantment", "land", "planeswalker"] },
            text: "Sacrifice an artifact, creature, enchantment, land, or planeswalker",
          },
        ],
        ifDid: {
          kind: "each-player-may",
          who: "each-opponent",
          options: [
            {
              sacrifice: { sharesCardTypeWith: "sacrificed" },
              text: "Sacrifice a permanent that shares a card type with it",
            },
          ],
          ifDidnt: {
            kind: "sequence",
            effects: [
              { kind: "lose-life", amount: 2, who: "that-player" },
              { kind: "draw", amount: 1 },
            ],
          },
        },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
