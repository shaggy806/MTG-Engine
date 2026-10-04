import { defineCard } from "../define.js";

// EDHREC rank 2993.
//
// Rulings:
//   [2019-10-04] In a Two-Headed Giant game, Cauldron Familiar's first ability causes the opposing
//     team to lose 1 life twice, and you gain 1 life once.
//   [2019-10-04] You can't activate Cauldron Familiar's last ability unless it's in your
//     graveyard.
//   [2024-11-08] If an effect refers to a Food, it means any Food artifact, not just a Food
//     artifact token. For example, you can sacrifice Tough Cookie (an Artifact Creature — Food
//     Golem) to activate Maraleaf Rider's ability (an ability with "Sacrifice a Food" in its
//     cost).

export default defineCard({
  name: "Cauldron Familiar",
  manaCost: "{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Cat"],
  power: 1,
  toughness: 1,
  text: "When this creature enters, each opponent loses 1 life and you gain 1 life.\nSacrifice a Food: Return this card from your graveyard to the battlefield.",
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: { filter: { subtype: "Food" } } },
      zone: "graveyard",
      staysInZone: true,
      targets: [],
      effect: { kind: "put-onto-battlefield", target: "source" },
      resolve: null,
      text: "Sacrifice a Food: Return this card from your graveyard to the battlefield.",
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "lose-life", amount: 1, who: "each-opponent" },
          { kind: "gain-life", amount: 1 },
        ],
      },
      resolve: null,
      text: "When this creature enters, each opponent loses 1 life and you gain 1 life.",
    },
  ],
});
