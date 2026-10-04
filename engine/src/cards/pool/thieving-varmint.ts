import { defineCard } from "../define.js";

// EDHREC rank 4420.
//
// "Spells you don't own" are those an opponent owns (every other player is an
// opponent) — `ownedBy: "opponent"`, matched against the card being cast with
// the spender as "you". Each unit carries the restriction, so the two can go
// to one spell or two (the ruling).
//
// Rulings:
//   [2024-04-12] You may spend the two mana added by the last ability on the same spell you don’t
//     own or on two different spells you don’t own.

export default defineCard({
  name: "Thieving Varmint",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Varmint"],
  power: 2,
  toughness: 1,
  keywords: ["deathtouch", "lifelink"],
  text: "Deathtouch, lifelink\n{T}, Pay 1 life: Add two mana of any one color. Spend this mana only to cast spells you don't own.",
  activated: [
    {
      cost: { mana: null, tap: true, payLife: 1 },
      targets: [],
      effect: {
        kind: "add-mana",
        mana: { oneOf: ["W", "U", "B", "R", "G"], same: true },
        amount: 2,
        spendOnly: {
          spell: { ownedBy: "opponent" },
          text: "Spend this mana only to cast spells you don't own.",
        },
      },
      resolve: null,
      text: "{T}, Pay 1 life: Add two mana of any one color. Spend this mana only to cast spells you don't own.",
    },
  ],
});
