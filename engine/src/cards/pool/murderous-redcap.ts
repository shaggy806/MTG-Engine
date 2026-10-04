import { defineCard } from "../define.js";
import { persist } from "../helpers.js";

// EDHREC rank 4212.
//
// Rulings:
//   [2008-05-01] Murderous Redcap’s power is checked at the time the ability resolves. If it’s
//     left the battlefield by then, its last known information is used.
//   [2013-06-07] If a creature with persist stops being a creature, persist will still work.
//   [2013-06-07] The persist ability triggers when the permanent is put into a graveyard. Its last
//     known information (that is, how the creature last existed on the battlefield) is used to
//     determine whether it had a -1/-1 counter on it.
//   [2013-06-07] When a permanent with persist returns to the battlefield, it’s a new object with
//     no memory of or connection to its previous existence.

const ETB_TEXT = "When this creature enters, it deals damage equal to its power to any target.";

export default defineCard({
  name: "Murderous Redcap",
  manaCost: "{2}{B/R}{B/R}",
  colors: ["B", "R"],
  types: ["creature"],
  subtypes: ["Goblin", "Assassin"],
  power: 2,
  toughness: 2,
  text: `${ETB_TEXT}\nPersist (When this creature dies, if it had no -1/-1 counters on it, return it to the battlefield under its owner's control with a -1/-1 counter on it.)`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["any-target"],
      effect: { kind: "damage", amount: { powerOf: "source" }, target: 0 },
      resolve: null,
      text: ETB_TEXT,
    },
    persist(),
  ],
});
