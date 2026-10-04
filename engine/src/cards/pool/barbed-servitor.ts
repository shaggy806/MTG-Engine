import { defineCard } from "../define.js";

// EDHREC rank 5594.
//
// Rulings:
//   [2024-02-02] A creature can be dealt an amount of damage greater than its toughness. For
//     example, if Barbed Servitor is dealt 3 damage, its last ability causes the target opponent
//     to lose 3 life.
//   [2024-02-02] If a creature is already suspected, suspecting it again won't have any effect.
//   [2024-02-02] There's no limit to the number of creatures that can be suspected simultaneously.
//     Suspecting a new creature doesn't cause other creatures to stop being suspected.
//   [2024-02-02] If a suspected creature loses all abilities, it will lose menace and "This
//     creature can't block", but it won't stop being suspected.
//   [2024-02-02] If your life total is brought to 0 or less at the same time that Barbed Servitor
//     is dealt damage, you lose the game before its last ability goes on the stack.
//   [2024-02-02] When an effect suspects a creature, it becomes suspected. It gains menace and
//     "This creature can't block" for as long as it's suspected. It stays suspected until it
//     leaves the battlefield or another effect causes it to no longer be suspected.
//   [2024-02-02] Being suspected isn't a copiable value. If a permanent becomes a copy of a
//     suspected creature, it won't be suspected.

export default defineCard({
  name: "Barbed Servitor",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["artifact", "creature"],
  subtypes: ["Construct"],
  power: 1,
  toughness: 1,
  keywords: ["indestructible"],
  text: "Indestructible\nWhen this creature enters, suspect it. (It has menace and can't block.)\nWhenever this creature deals combat damage to a player, you draw a card and you lose 1 life.\nWhenever this creature is dealt damage, target opponent loses that much life.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "suspect", target: "source" },
      resolve: null,
      text: "When this creature enters, suspect it.",
    },
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "draw", amount: 1 },
          { kind: "lose-life", amount: 1 },
        ],
      },
      resolve: null,
      text: "Whenever this creature deals combat damage to a player, you draw a card and you lose 1 life.",
    },
    {
      trigger: { on: "dealt-damage", who: "self" },
      // Brash Taunter's trigger: the trigger value is the damage dealt.
      targets: ["opponent"],
      effect: { kind: "lose-life", amount: { triggerValue: true }, target: 0 },
      resolve: null,
      text: "Whenever this creature is dealt damage, target opponent loses that much life.",
    },
  ],
});
