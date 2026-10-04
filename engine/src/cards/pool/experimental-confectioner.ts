import { defineCard } from "../define.js";

// EDHREC rank 3831.
// Makes Food → use "Food Token".
// Makes Rat → use "Rat Token (Can't Block)".
//
// Rulings:
//   [2024-11-08] If an effect refers to a Food, it means any Food artifact, not just a Food
//     artifact token. For example, you can sacrifice Tough Cookie (an Artifact Creature — Food
//     Golem) to activate Maraleaf Rider's ability (an ability with "Sacrifice a Food" in its
//     cost).
//   [2024-11-08] You can't sacrifice a Food to pay multiple costs. For example, you can't
//     sacrifice a Food token to activate its own ability and also to activate Maraleaf Rider's
//     ability.
//   [2024-11-08] Whatever you do, don't eat the delicious cards.
//   [2024-11-08] Food is an artifact type. Even though it appears on some creatures, it's never a
//     creature type.

export default defineCard({
  name: "Experimental Confectioner",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Human", "Peasant"],
  power: 2,
  toughness: 3,
  text: "When this creature enters, create a Food token. (It's an artifact with \"{2}, {T}, Sacrifice this token: You gain 3 life.\")\nWhenever you sacrifice a Food, create a 1/1 black Rat creature token with \"This token can't block.\"",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Food Token", count: 1 },
      resolve: null,
      text: "When this creature enters, create a Food token.",
    },
    {
      trigger: { on: "sacrifice", who: "you", filter: { subtype: "Food" } },
      targets: [],
      effect: { kind: "create-token", token: "Rat Token (Can't Block)", count: 1 },
      resolve: null,
      text: "Whenever you sacrifice a Food, create a 1/1 black Rat creature token with \"This token can't block.\"",
    },
  ],
});
