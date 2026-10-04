import { defineCard } from "../define.js";

// EDHREC rank 3264.
// Makes Food → use "Food Token".
//
// Rulings:
//   [2024-11-08] Whatever you do, don't eat the delicious cards.
//   [2024-11-08] If an effect refers to a Food, it means any Food artifact, not just a Food
//     artifact token. For example, you can sacrifice Tough Cookie (an Artifact Creature — Food
//     Golem) to activate Maraleaf Rider's ability (an ability with "Sacrifice a Food" in its
//     cost).
//   [2024-11-08] Food is an artifact type. Even though it appears on some creatures, it's never a
//     creature type.
//   [2024-11-08] You can't sacrifice a Food to pay multiple costs. For example, you can't
//     sacrifice a Food token to activate its own ability and also to activate Maraleaf Rider's
//     ability.

export default defineCard({
  name: "Savvy Hunter",
  manaCost: "{1}{B}{G}",
  colors: ["B", "G"],
  types: ["creature"],
  subtypes: ["Human", "Warrior"],
  power: 3,
  toughness: 3,
  text: "Whenever this creature attacks or blocks, create a Food token. (It's an artifact with \"{2}, {T}, Sacrifice this token: You gain 3 life.\")\nSacrifice two Foods: Draw a card.",
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Food Token", count: 1 },
      resolve: null,
      text: "Whenever this creature attacks or blocks, create a Food token.",
    },
    {
      trigger: { on: "blocks", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Food Token", count: 1 },
      resolve: null,
      text: "Whenever this creature attacks or blocks, create a Food token.",
    },
  ],
  activated: [
    {
      // Sai, Master Thopterist's "Sacrifice two artifacts" with Bog Naughty's
      // Food filter: any Food artifact, not only a token (the ruling).
      cost: { mana: null, tap: false, sacrifice: { filter: { subtype: "Food" }, count: 2 } },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "Sacrifice two Foods: Draw a card.",
    },
  ],
});
