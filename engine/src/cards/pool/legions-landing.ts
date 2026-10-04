import { defineCard } from "../define.js";

// EDHREC rank 3814.
// Makes "Lifelink Vampire Token".
//
// Rulings:
//   [2017-09-29] The last ability of Legion's Landing only counts creatures that you declare as
//     attacking creatures. Creatures that enter the battlefield attacking won't count.
//   [2017-09-29] Once you've attacked with three or more creatures, Legion's Landing will
//     transform even if some of those creatures leave the battlefield or are removed from combat.

export default defineCard({
  name: "Legion's Landing",
  manaCost: "{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["enchantment"],
  text: "When Legion's Landing enters, create a 1/1 white Vampire creature token with lifelink.\nWhen you attack with three or more creatures, transform Legion's Landing.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Lifelink Vampire Token", count: 1 },
      resolve: null,
      text: "When Legion's Landing enters, create a 1/1 white Vampire creature token with lifelink.",
    },
    {
      trigger: { on: "attack-with", who: "you", atLeast: 3 },
      targets: [],
      effect: { kind: "transform", target: "source" },
      resolve: null,
      text: "When you attack with three or more creatures, transform Legion's Landing.",
    },
  ],
  faces: ["Legion's Landing", "Adanto, the First Fort"],
  transform: true,
});
