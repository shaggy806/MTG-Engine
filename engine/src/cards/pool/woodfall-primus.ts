import { defineCard } from "../define.js";
import { persist } from "../helpers.js";

// EDHREC rank 3998.
//
// Rulings:
//   [2013-06-07] If a creature with persist stops being a creature, persist will still work.
//   [2013-06-07] If a permanent has multiple instances of persist, they'll each trigger
//     separately, but the redundant instances will have no effect. If one instance returns the
//     card to the battlefield, the next to resolve will do nothing.
//   [2013-06-07] If multiple creatures with persist are put into the graveyard at the same time
//     (due to combat damage or a spell that destroys all creatures, for example), the active
//     player (the player whose turn it is) puts all of their persist triggers on the stack in any
//     order, then each other player in turn order does the same. The last trigger put on the stack
//     is the first one that resolves. That means that in a two-player game, the nonactive player's
//     persist creatures will return to the battlefield first, then the active player's persist
//     creatures do the same. The creatures return to the battlefield one at a time.
//   [2013-06-07] If a creature with persist that has +1/+1 counters on it receives enough -1/-1
//     counters to cause it to be destroyed by lethal damage or put into its owner's graveyard for
//     having 0 or less toughness, persist won't trigger and the card won't return to the
//     battlefield. That's because persist checks the creature's existence just before it leaves
//     the battlefield, and it still has all those counters on it at that point.
//   [2013-06-07] If a token with no -1/-1 counters on it has persist, the ability will trigger
//     when the token is put into the graveyard. However, the token will cease to exist and can't
//     return to the battlefield.
//   [2013-06-07] The persist ability triggers when the permanent is put into a graveyard. Its last
//     known information (that is, how the creature last existed on the battlefield) is used to
//     determine whether it had a -1/-1 counter on it.
//   [2013-06-07] When a permanent with persist returns to the battlefield, it's a new object with
//     no memory of or connection to its previous existence.

export default defineCard({
  name: "Woodfall Primus",
  manaCost: "{5}{G}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Treefolk", "Shaman"],
  power: 6,
  toughness: 6,
  keywords: ["trample"],
  text: "Trample\nWhen this creature enters, destroy target noncreature permanent.\nPersist (When this creature dies, if it had no -1/-1 counters on it, return it to the battlefield under its owner's control with a -1/-1 counter on it.)",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [{ kind: "permanent", filter: { notTypes: ["creature"] } }],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: "When this creature enters, destroy target noncreature permanent.",
    },
    persist(),
  ],
});
