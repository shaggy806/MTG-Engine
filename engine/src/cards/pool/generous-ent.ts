import { defineCard } from "../define.js";

// EDHREC rank 5121.
// Makes Food → use "Food Token".
//
// Rulings:
//   [2023-06-16] Typecycling is a form of cycling. Any ability that triggers on a card being
//     cycled also triggers on a card being typecycled. Any ability that stops a cycling ability
//     from being activated also stops a typecycling ability from being activated.
//   [2023-06-16] Unlike the normal cycling ability, typecycling doesn't allow you to draw a card.
//     Rather, it lets you search your library for a card with the type or types indicated by the
//     ability name. For example, a card with basic landcycling lets you search for a basic land
//     card, and a card with Wizardcycling lets you search for a Wizard card.
//   [2024-11-08] You can't sacrifice a Food to pay multiple costs. For example, you can't
//     sacrifice a Food token to activate its own ability and also to activate Maraleaf Rider's
//     ability.
//   [2024-11-08] Food is an artifact type. Even though it appears on some creatures, it's never a
//     creature type.
//   [2024-11-08] Whatever you do, don't eat the delicious cards.

export default defineCard({
  name: "Generous Ent",
  manaCost: "{5}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Treefolk"],
  power: 5,
  toughness: 7,
  keywords: ["reach"],
  text: "Reach\nWhen this creature enters, create a Food token. (It's an artifact with \"{2}, {T}, Sacrifice this token: You gain 3 life.\")\nForestcycling {1} ({1}, Discard this card: Search your library for a Forest card, reveal it, put it into your hand, then shuffle.)",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Food Token", count: 1 },
      resolve: null,
      text: "When this creature enters, create a Food token.",
    },
  ],
  cycling: { cost: "{1}", search: { subtype: "Forest" } },
});
