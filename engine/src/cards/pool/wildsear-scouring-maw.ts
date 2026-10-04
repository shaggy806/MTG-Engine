import { defineCard } from "../define.js";

// EDHREC rank 3599.
//
// Rulings:
//   [2024-07-26] In some unusual situations, you may lose control of Wildsear during the process
//     of casting an enchantment spell from your hand. In those situations, that spell won't have
//     cascade.
//   [2024-07-26] A spell's mana value is determined only by its mana cost. Ignore any alternative
//     costs, additional costs, cost increases, or cost reductions.
//   [2024-07-26] Once you announce that you're casting a spell, players can't take actions until
//     you've finished casting it. Causing Wildsear to leave the battlefield after you've cast an
//     enchantment spell from your hand won't stop that spell's cascade ability from resolving.
//   [2024-07-26] Due to a 2021 rules change to cascade, not only do you stop exiling cards if you
//     exile a nonland card with lesser mana value than the spell with cascade, but the resulting
//     spell you cast must also have lesser mana value. Previously, in cases where a card's mana
//     value differed from the resulting spell, such as with some modal double-faced cards or cards
//     with an Adventure, you could cast a spell with a higher mana value than the exiled card.
//   [2024-07-26] If the card has {X} in its mana cost, you must choose 0 as the value of X when
//     casting it without paying its mana cost.
//   [2024-07-26] When the cascade ability resolves, you must exile cards. The only optional part
//     of the ability is whether or not you cast the last card exiled.
//   [2024-07-26] The mana value of a split card is determined by the combined mana cost of its two
//     halves. If cascade allows you to cast a split card, you may cast either half but not both
//     halves.
//   [2024-07-26] You exile the cards face up. All players will be able to see them.
//   [2024-07-26] If you cast a card "without paying its mana cost," you can't choose to cast it
//     for any alternative costs. You can, however, pay additional costs. If the card has any
//     mandatory additional costs, you must pay those to cast the card.
//   [2024-07-26] Cascade triggers when you cast the spell, meaning that it resolves before that
//     spell. If you end up casting the exiled card, it will go on the stack above the spell with
//     cascade.
//   [2024-07-26] If a spell with cascade is countered, the cascade ability will still resolve
//     normally.

// Cascade is granted to the spell as a `this-cast` trigger (Imoti's shape),
// so it fires as the spell is cast and Wildsear leaving afterwards doesn't
// stop it (the ruling).
const CASCADE = {
  trigger: { on: "this-cast" },
  targets: [],
  effect: { kind: "cascade" },
  resolve: null,
  text: "Cascade",
} as const;
const STATIC_TEXT = "Enchantment spells you cast from your hand have cascade.";

export default defineCard({
  name: "Wildsear, Scouring Maw",
  manaCost: "{3}{R}{G}",
  colors: ["R", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elemental", "Wolf"],
  power: 6,
  toughness: 6,
  keywords: ["trample"],
  text: "Trample\nEnchantment spells you cast from your hand have cascade. (Whenever you cast an enchantment spell from your hand, exile cards from the top of your library until you exile a nonland card that costs less. You may cast it without paying its mana cost. Put the exiled cards on the bottom in a random order.)",
  static: [
    {
      affects: { scope: "self" },
      grantsToSpells: { filter: { type: "enchantment" }, castFrom: ["hand"], triggered: [CASCADE] },
      text: STATIC_TEXT,
    },
  ],
});
