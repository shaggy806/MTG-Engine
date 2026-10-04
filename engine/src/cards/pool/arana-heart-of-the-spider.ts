import { defineCard } from "../define.js";

// EDHREC rank 5611.
//
// Rulings:
//   [2025-09-19] A creature that is equipped is considered modified no matter who controls the
//     Equipment that's attached to it.
//   [2025-09-19] An Aura controlled by an opponent does not cause a creature you control to be
//     modified.
//   [2025-09-19] A creature with a counter on it is considered modified no matter what kind of
//     counter it is or which player put it on that creature.

export default defineCard({
  name: "Araña, Heart of the Spider",
  manaCost: "{1}{R}{W}",
  colors: ["W", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Spider", "Human", "Hero"],
  power: 3,
  toughness: 3,
  text: "Whenever you attack, put a +1/+1 counter on target attacking creature.\nWhenever a modified creature you control deals combat damage to a player, exile the top card of your library. You may play that card this turn. (Equipment, Auras you control, and counters are modifications.)",
  triggered: [
    {
      // Hollowmurk Siege's Abzan trigger, without the menace.
      trigger: { on: "attack-with", who: "you", atLeast: 1 },
      targets: [{ kind: "permanent", whose: "any", filter: { type: "creature", attacking: true } }],
      effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "Whenever you attack, put a +1/+1 counter on target attacking creature.",
    },
    {
      // Kodama of the West Tree's "modified creature you control" trigger;
      // the exile is Laelia's `impulse-exile` for this turn.
      trigger: { on: "deals-combat-damage-to-player", who: "you-control", filter: { modified: true } },
      targets: [],
      effect: { kind: "impulse-exile", amount: 1, duration: "end-of-turn" },
      resolve: null,
      text: "Whenever a modified creature you control deals combat damage to a player, exile the top card of your library. You may play that card this turn.",
    },
  ],
});
