import { defineCard } from "../define.js";

// EDHREC rank 2707.
//
// Rulings:
//   [2016-09-20] If you cast the card, you do so as part of the resolution of Torrential
//     Gearhulk's triggered ability. You can't wait to cast it later in the turn. Timing
//     restrictions (such as "Cast [this card] only during combat") still apply.
//   [2016-09-20] If you cast a card "without paying its mana cost," you can't choose to cast it
//     for any alternative costs, such as emerge costs. You can, however, pay additional costs. If
//     the card has any mandatory additional costs, such as that of Incendiary Sabotage, you must
//     pay those to cast the card.
//   [2016-09-20] If the card has {X} in its mana cost, you must choose 0 as the value of X when
//     casting it without paying its mana cost.
//
// Chandra, Acolyte of Flame's `cast-now` shape, made free: X is 0, additional
// costs are still paid, and the spell is exiled instead of going to the graveyard.
const ETB_TEXT =
  "When this creature enters, you may cast target instant card from your graveyard without paying its mana cost. If that spell would be put into your graveyard, exile it instead.";

export default defineCard({
  name: "Torrential Gearhulk",
  manaCost: "{4}{U}{U}",
  colors: ["U"],
  types: ["artifact", "creature"],
  subtypes: ["Construct"],
  power: 5,
  toughness: 6,
  keywords: ["flash"],
  text: `Flash\n${ETB_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "instant" } }],
      effect: { kind: "cast-now", target: 0, free: true, exileAfter: true },
      resolve: null,
      text: ETB_TEXT,
    },
  ],
});
