import { defineCard } from "../define.js";

// EDHREC rank 5489.
//
// Rulings:
//   [2024-04-12] Putting a land card onto the battlefield with Kellan’s last ability doesn’t count
//     as playing a land. It can put a land card onto the battlefield even if you’ve already played
//     your land for the turn.
//   [2024-04-12] If the permanent spell you cast has {X} in its mana cost, you must choose 0 as
//     the value of X when casting it without paying its mana cost.
//   [2024-04-12] A permanent spell is an artifact, battle, creature, enchantment, or planeswalker
//     spell.
//   [2024-04-12] If the spell you cast that caused Kellan, the Kid’s last ability to trigger is
//     represented by a split card, the characteristics of the half you didn’t cast are ignored
//     while that spell is on the stack. For example, if you cast the Cease half of Cease // Desist
//     from the Murders at Karlov Manor release, that spell’s mana value is 2 because Cease’s mana
//     cost is {1}{B}{G}.
//   [2024-04-12] If the spell you cast that caused Kellan, the Kid’s last ability to trigger has
//     {X} in its mana cost, X is the value chosen as that spell was cast for the purpose of
//     determining its mana value.
//   [2024-04-12] If you cast a spell “without paying its mana cost,” you can’t choose to cast it
//     for any alternative costs. You can, however, pay additional costs, such as kicker costs. If
//     the spell has any mandatory additional costs, those must be paid to cast the spell.

const TEXT =
  "Whenever you cast a spell from anywhere other than your hand, you may cast a permanent spell with equal or lesser mana value from your hand without paying its mana cost. If you don't, you may put a land card from your hand onto the battlefield.";

export default defineCard({
  name: "Kellan, the Kid",
  manaCost: "{G}{W}{U}",
  colors: ["W", "U", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Faerie", "Rogue"],
  power: 3,
  toughness: 3,
  keywords: ["flying", "lifelink"],
  text: `Flying, lifelink\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", notFrom: "hand" },
      targets: [],
      effect: {
        kind: "cast-now",
        from: "hand",
        free: true,
        spell: {
          typesAnyOf: ["artifact", "battle", "creature", "enchantment", "planeswalker"],
          // "Equal or lesser mana value" — the triggering spell's, its {X}
          // included (the ruling); a free cast's own X is 0.
          manaValue: { op: "lte", n: { amount: { manaValueOf: "trigger-object" } } },
        },
        else: {
          kind: "look-and-choose",
          zone: "hand",
          min: 0,
          max: 1,
          destination: "battlefield",
          leftover: "stay",
          filter: { type: "land" },
        },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
