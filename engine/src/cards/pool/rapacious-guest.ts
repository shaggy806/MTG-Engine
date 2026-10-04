import { defineCard } from "../define.js";

// EDHREC rank 3337.
// Makes Food → use "Food Token".
//
// Rulings:
//   [2023-06-16] Rapacious Guest's third ability triggers whenever you sacrifice a Food for any
//     reason, not just to activate a Food's activated ability.
//   [2023-06-16] To determine the amount of life the target opponent loses from Rapacious Guest's
//     last ability, use Rapacious Guest's power as it last existed on the battlefield, not its
//     power in the graveyard.
//   [2024-11-08] You can't sacrifice a Food to pay multiple costs. For example, you can't
//     sacrifice a Food token to activate its own ability and also to activate Maraleaf Rider's
//     ability.
//   [2024-11-08] Food is an artifact type. Even though it appears on some creatures, it's never a
//     creature type.
//   [2024-11-08] If an effect refers to a Food, it means any Food artifact, not just a Food
//     artifact token. For example, you can sacrifice Tough Cookie (an Artifact Creature — Food
//     Golem) to activate Maraleaf Rider's ability (an ability with "Sacrifice a Food" in its
//     cost).
//   [2024-11-08] Whatever you do, don't eat the delicious cards.

export default defineCard({
  name: "Rapacious Guest",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Halfling", "Citizen"],
  power: 2,
  toughness: 2,
  keywords: ["menace"],
  text: "Menace\nWhenever one or more creatures you control deal combat damage to a player, create a Food token.\nWhenever you sacrifice a Food, put a +1/+1 counter on this creature.\nWhen this creature leaves the battlefield, target opponent loses life equal to its power.",
  triggered: [
    {
      trigger: {
        on: "deals-damage-batch",
        who: "you-control",
        filter: { type: "creature" },
        combat: true,
      },
      targets: [],
      effect: { kind: "create-token", token: "Food Token", count: 1 },
      resolve: null,
      text: "Whenever one or more creatures you control deal combat damage to a player, create a Food token.",
    },
    {
      trigger: { on: "sacrifice", who: "you", filter: { subtype: "Food" } },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "Whenever you sacrifice a Food, put a +1/+1 counter on this creature.",
    },
    {
      trigger: { on: "leaves-battlefield", who: "self" },
      targets: ["opponent"],
      // Its power as it last existed on the battlefield (the ruling; rule 603.10a).
      effect: { kind: "lose-life", target: 0, amount: { powerOf: "source" } },
      resolve: null,
      text: "When this creature leaves the battlefield, target opponent loses life equal to its power.",
    },
  ],
});
