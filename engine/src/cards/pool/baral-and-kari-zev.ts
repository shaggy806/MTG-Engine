import { defineCard } from "../define.js";

// "Your first instant or sorcery spell each turn" counts spells cast before
// Baral and Kari Zev arrived too (the ruling). The free spell is compared
// with the triggering spell as it is on the stack — its mana value with X —
// or as it last was there, and shares a card type with it (a kindred instant
// shares "instant" and "kindred"). Nothing cast, for whatever reason, makes
// First Mate Ragavan.
const TEXT =
  "Whenever you cast your first instant or sorcery spell each turn, you may cast a spell with lesser mana value that shares a card type with it from your hand without paying its mana cost. If you don't, create First Mate Ragavan, a legendary 2/1 red Monkey Pirate creature token. It gains haste until end of turn.";

export default defineCard({
  name: "Baral and Kari Zev",
  manaCost: "{1}{U}{R}",
  colors: ["U", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human"],
  power: 2,
  toughness: 4,
  keywords: ["first-strike", "menace"],
  text: `First strike, menace\n${TEXT}`,
  triggered: [
    {
      trigger: {
        on: "cast-spell",
        who: "you",
        firstEachTurn: true,
        filter: { typesAnyOf: ["instant", "sorcery"] },
      },
      targets: [],
      effect: {
        kind: "cast-now",
        from: "hand",
        free: true,
        spell: {
          sharesCardTypeWith: "trigger-object",
          manaValue: { op: "lt", n: { amount: { manaValueOf: "trigger-object" } } },
        },
        else: {
          kind: "create-token",
          token: "First Mate Ragavan",
          count: 1,
          gainUntilEndOfTurn: ["haste"],
        },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
