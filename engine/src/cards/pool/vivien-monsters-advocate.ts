import { defineCard } from "../define.js";

// EDHREC rank 6469.
//
// Rulings:
//   [2020-04-17] After activating Vivien's last loyalty ability, the delayed triggered ability it
//     creates will put a creature card onto the battlefield before the creature spell that caused
//     the ability to trigger resolves.
//   [2020-04-17] For spells with {X} in their mana costs, use the value chosen for X to determine
//     the spell's mana value.
//   [2020-04-17] If a card in a player's library has {X} in its mana cost, X is considered to be 0.
//
// The top-card look and cast are Vizier of the Menagerie's. The +1's counter
// is chosen as the ability resolves, then goes on the token as it's made
// (`thenCounters` — on each one, should a replacement make more). The −2 is
// Codie's `nextSpell` delayed trigger: "lesser" reads the spell that fired it
// (its trigger object), with its chosen X.
const LOOK_TEXT = "You may look at the top card of your library any time.";
const CAST_TEXT = "You may cast creature spells from the top of your library.";
const PLUS_TEXT =
  "+1: Create a 3/3 green Beast creature token. Put your choice of a reach counter, a vigilance counter, or a trample counter on it.";
const MINUS_TEXT =
  "−2: When you next cast a creature spell this turn, search your library for a creature card with lesser mana value, put it onto the battlefield, then shuffle.";
const DELAYED_TEXT =
  "Search your library for a creature card with lesser mana value, put it onto the battlefield, then shuffle.";

const beastWith = (counter: "reach" | "vigilance" | "trample") => ({
  text: `A ${counter} counter`,
  effect: {
    kind: "create-token" as const,
    token: "3/3 Beast Token",
    count: 1,
    thenCounters: { kind: counter, amount: 1 },
  },
});

export default defineCard({
  name: "Vivien, Monsters' Advocate",
  manaCost: "{3}{G}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["planeswalker"],
  subtypes: ["Vivien"],
  loyalty: 3,
  text: `${LOOK_TEXT}\n${CAST_TEXT}\n${PLUS_TEXT}\n${MINUS_TEXT}`,
  looksAtOwnLibraryTop: true,
  static: [
    {
      affects: { scope: "self" },
      castFromLibraryTop: { filter: { type: "creature" } },
      text: CAST_TEXT,
    },
  ],
  activated: [
    {
      loyaltyCost: 1,
      cost: { mana: null, tap: false },
      targets: [],
      effect: {
        kind: "modal",
        minModes: 1,
        maxModes: 1,
        modes: [beastWith("reach"), beastWith("vigilance"), beastWith("trample")],
      },
      resolve: null,
      text: PLUS_TEXT,
    },
    {
      loyaltyCost: -2,
      cost: { mana: null, tap: false },
      targets: [],
      effect: {
        kind: "delayed-trigger",
        at: { nextSpell: { type: "creature" } },
        effect: {
          kind: "search-library",
          filter: {
            type: "creature",
            manaValue: { op: "lt", n: { amount: { manaValueOf: "trigger-object" } } },
          },
          destination: "battlefield",
          min: 0,
          max: 1,
        },
        text: DELAYED_TEXT,
      },
      resolve: null,
      text: MINUS_TEXT,
    },
  ],
});
