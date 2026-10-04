import { defineCard } from "../define.js";

// EDHREC rank 3967.
//
// Rulings:
//   [2021-06-18] The mana value of a split card is determined by the combined mana cost of its two
//     halves. If cascade allows you to cast a split card, you may cast either half but not both
//     halves.
//   [2021-06-18] Due to a 2021 rules change to cascade, not only do you stop exiling cards if you
//     exile a nonland card with lesser mana value than the spell with cascade, but the resulting
//     spell you cast must also have lesser mana value. Previously, in cases where a card's mana
//     value differed from the resulting spell, such as with some modal double-faced cards or cards
//     with an Adventure, you could cast a spell with a higher mana value than the exiled card.
//   [2021-06-18] Cascade triggers when you cast the spell, meaning that it resolves before that
//     spell. If you end up casting the exiled card, it will go on the stack above the spell with
//     cascade.
//   [2021-06-18] A spell's mana value is determined only by its mana cost. Ignore any alternative
//     costs, additional costs, cost increases, or cost reductions.
//   [2021-06-18] If the card has {X} in its mana cost, you must choose 0 as the value of X when
//     casting it without paying its mana cost.
//   [2021-06-18] You exile the cards face up. All players will be able to see them.
//   [2021-06-18] When the cascade ability resolves, you must exile cards. The only optional part
//     of the ability is whether or not you cast the last card exiled.
//   [2021-06-18] If you cast a card "without paying its mana cost," you can't choose to cast it
//     for any alternative costs. You can, however, pay additional costs. If the card has any
//     mandatory additional costs, you must pay those to cast the card.
//   [2021-06-18] If a spell with cascade is countered, the cascade ability will still resolve
//     normally.

export default defineCard({
  name: "Annoyed Altisaur",
  manaCost: "{5}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Dinosaur"],
  power: 6,
  toughness: 5,
  keywords: ["reach", "trample"],
  text: "Reach, trample\nCascade (When you cast this spell, exile cards from the top of your library until you exile a nonland card that costs less. You may cast it without paying its mana cost. Put the exiled cards on the bottom in a random order.)",
  triggered: [
    {
      trigger: { on: "this-cast" },
      targets: [],
      effect: { kind: "cascade" },
      resolve: null,
      text: "Cascade",
    },
  ],
});
