import { defineCard } from "../define.js";

// EDHREC rank 6062.
//
// Rulings:
//   [2024-11-08] You can't sacrifice a Food to pay multiple costs. For example, you can't
//     sacrifice a Food token to activate its own ability and also to activate Maraleaf Rider's
//     ability.
//   [2024-11-08] Food is an artifact type. Even though it appears on some creatures, it's never a
//     creature type.

const TEXT = "When this creature enters or dies, create a Food token.";

export default defineCard({
  name: "Vinereap Mentor",
  manaCost: "{B}{G}",
  colors: ["B", "G"],
  types: ["creature"],
  subtypes: ["Squirrel", "Druid"],
  power: 3,
  toughness: 2,
  text: "When this creature enters or dies, create a Food token. (It's an artifact with \"{2}, {T}, Sacrifice this token: You gain 3 life.\")",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Food Token", count: 1 },
      resolve: null,
      text: TEXT,
    },
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Food Token", count: 1 },
      resolve: null,
      text: TEXT,
    },
  ],
});
