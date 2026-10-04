import { defineCard } from "../define.js";

// EDHREC rank 6097.
//
// Rulings:
//   [2018-04-27] You can’t cast a legendary sorcery unless you control a legendary creature or a
//     legendary planeswalker. Once you begin to cast a legendary sorcery, losing control of your
//     legendary creatures and planeswalkers won’t affect that spell.
//   [2018-04-27] All of the permanents put onto the battlefield this way enter at the same time.
//     If any have triggered abilities that trigger on something else entering the battlefield,
//     they’ll see each other.
//   [2018-04-27] Other than the casting restriction, the legendary supertype on a sorcery carries
//     no additional rules. You may cast any number of legendary sorceries in a turn, and your deck
//     may contain any number of legendary cards (but no more than four of any with the same name).
//   [2018-04-27] For cards in your library with {X} in their mana costs, X is considered to be 0.

export default defineCard({
  name: "Kamahl's Druidic Vow",
  manaCost: "{X}{G}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["sorcery"],
  text: "(You may cast a legendary sorcery only if you control a legendary creature or planeswalker.)\nLook at the top X cards of your library. You may put any number of land and/or legendary permanent cards with mana value X or less from among them onto the battlefield. Put the rest into your graveyard.",
  // The legendary-sorcery restriction (rule 205.4e), Primevals' Glorious Rebirth's shape.
  castOnlyIf: {
    kind: "controls",
    filter: { supertype: "legendary", typesAnyOf: ["creature", "planeswalker"] },
    atLeast: 1,
  },
  // Genesis Wave's shape, without the reveal: the chosen cards enter at once
  // (the ruling), and the rest go to the graveyard. A land's mana value is 0,
  // so "with mana value X or less" never excludes one.
  effect: {
    kind: "look-and-choose",
    zone: "library",
    count: "x",
    min: 0,
    max: "x",
    destination: "battlefield",
    leftover: "graveyard",
    filter: {
      anyOf: [
        { type: "land" },
        {
          supertype: "legendary",
          typesAnyOf: ["artifact", "creature", "enchantment", "land", "planeswalker", "battle"],
          manaValue: { op: "lte", n: { amount: "x" } },
        },
      ],
    },
  },
});
