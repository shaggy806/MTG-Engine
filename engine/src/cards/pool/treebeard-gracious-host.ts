import { defineCard } from "../define.js";
import { ward } from "../helpers.js";

// EDHREC rank 3500.
// Makes Food → use "Food Token".
//
// Rulings:
//   [2024-11-08] You can't sacrifice a Food to pay multiple costs. For example, you can't
//     sacrifice a Food token to activate its own ability and also to activate Maraleaf Rider's
//     ability.
//   [2024-11-08] Whatever you do, don't eat the delicious cards.
//   [2024-11-08] Food is an artifact type. Even though it appears on some creatures, it's never a
//     creature type.

export default defineCard({
  name: "Treebeard, Gracious Host",
  manaCost: "{2}{G}{W}",
  colors: ["W", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Treefolk"],
  power: 0,
  toughness: 5,
  keywords: ["trample"],
  text: "Trample, ward {2}\nWhen Treebeard enters, create two Food tokens.\nWhenever you gain life, put that many +1/+1 counters on target Halfling or Treefolk.",
  triggered: [
    ward({ mana: "{2}" }),
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Food Token", count: 2 },
      resolve: null,
      text: "When Treebeard enters, create two Food tokens.",
    },
    {
      trigger: { on: "gains-life", who: "you" },
      // Any Halfling or Treefolk permanent, whoever controls it.
      targets: [{ kind: "permanent", filter: { subtypes: ["Halfling", "Treefolk"] } }],
      effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: { triggerValue: true } },
      resolve: null,
      text: "Whenever you gain life, put that many +1/+1 counters on target Halfling or Treefolk.",
    },
  ],
});
