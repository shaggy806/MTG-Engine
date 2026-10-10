import { defineCard } from "../define.js";

// Top-500 commander #477. The hand is counted after the draw, as the
// trigger resolves ("then").
const ATTACK =
  "Whenever Cecily, Haunted Mage attacks, you draw a card and you lose 1 life. Then if you have eleven or more cards in your hand, you may cast an instant or sorcery spell from your hand without paying its mana cost.";

export default defineCard({
  name: "Cecily, Haunted Mage",
  manaCost: "{1}{U}{B}{R}",
  colors: ["U", "B", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 3,
  toughness: 5,
  pairing: { kind: "partner-group", group: "Friends forever" },
  text: `Your maximum hand size is eleven.\n${ATTACK}\nPartner—Friends forever (You can have two commanders if both have this ability.)`,
  static: [{ affects: { scope: "self" }, maxHandSize: { who: "you", set: 11 }, text: "Your maximum hand size is eleven." }],
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "draw", amount: 1 },
          { kind: "lose-life", amount: 1, who: "you" },
          {
            kind: "conditional",
            condition: { kind: "hand-size", atLeast: 11 },
            then: { kind: "cast-now", from: "hand", free: true, spell: { typesAnyOf: ["instant", "sorcery"] } },
          },
        ],
      },
      resolve: null,
      text: ATTACK,
    },
  ],
});
