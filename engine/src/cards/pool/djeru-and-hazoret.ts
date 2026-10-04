import { defineCard } from "../define.js";

// EDHREC rank 5392.
//
// Rulings:
//   [2023-04-14] If you cast a spell without paying its mana cost, you can't choose to cast it for
//     any alternative costs. You can, however, pay any additional costs. If the spell has any
//     mandatory additional costs, you must pay those.
//   [2023-04-14] If the spell has {X} in its mana cost, you must choose 0 as the value of X when
//     casting it without paying its mana cost.
//   [2023-04-14] Once Djeru and Hazoret has legally attacked during the turn it came under your
//     control, causing it to lose haste by adding cards to your hand won't cause it to stop
//     attacking. Similarly, causing it to lose vigilance after it has attacked won't cause it to
//     become tapped.
// The exiled card gets Codie, Vociferous Codex's "until end of turn, you may
// cast that card without paying its mana cost" (`allow-cast-from-exile`,
// free), applied to the card chosen.

const STATIC_TEXT = "As long as you have one or fewer cards in hand, Djeru and Hazoret has vigilance and haste.";
const ATTACK_TEXT =
  "Whenever Djeru and Hazoret attacks, look at the top six cards of your library. You may exile a legendary creature card from among them. Put the rest on the bottom of your library in a random order. Until end of turn, you may cast the exiled card without paying its mana cost.";

export default defineCard({
  name: "Djeru and Hazoret",
  manaCost: "{2}{R}{R}{W}",
  colors: ["W", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "God"],
  power: 5,
  toughness: 4,
  text: `${STATIC_TEXT}\n${ATTACK_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      condition: { kind: "hand-size", atMost: 1 },
      grantKeywords: ["vigilance", "haste"],
      text: STATIC_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: {
        kind: "look-and-choose",
        zone: "library",
        count: 6,
        min: 0,
        max: 1,
        filter: { type: "creature", supertype: "legendary" },
        destination: "exile",
        leftover: "bottom-random",
        then: { kind: "allow-cast-from-exile", target: 0, free: true },
      },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
});
