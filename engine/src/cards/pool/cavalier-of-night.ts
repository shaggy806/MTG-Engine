import { defineCard } from "../define.js";

// EDHREC rank 5590.
//
// Rulings:
//   [2019-07-12] Cavalier of Night’s enters-the-battlefield ability goes on the stack without a
//     target. While that ability is resolving, you may sacrifice another creature. When you do,
//     the reflexive triggered ability triggers and you pick a target creature to be destroyed.
//     This is different from effects that say “If you do . . .” in that players may take actions
//     after you’ve sacrificed the creature but before the target creature is destroyed.
//   [2019-07-12] If a card in a graveyard has {X} in its mana cost, X is considered to be 0.
//   [2019-07-12] If a creature card with mana value 3 or less becomes a copy of Cavalier of Night,
//     its last ability can target itself when it dies.
//   [2019-07-12] While resolving Cavalier of Night’s enters-the-battlefield ability, you can’t
//     sacrifice more than one creature.

export default defineCard({
  name: "Cavalier of Night",
  manaCost: "{2}{B}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Elemental", "Knight"],
  power: 4,
  toughness: 5,
  keywords: ["lifelink"],
  text: "Lifelink\nWhen this creature enters, you may sacrifice another creature. When you do, destroy target creature an opponent controls.\nWhen this creature dies, return target creature card with mana value 3 or less from your graveyard to the battlefield.",
  triggered: [
    {
      // "When you do" is a reflexive ability (rule 603.12, Ziatora's shape):
      // the sacrifice happens as this resolves, then the destroy goes on the
      // stack and picks its target.
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "each-player-may",
        who: "you",
        options: [{ sacrifice: { type: "creature" }, exceptSource: true, text: "Sacrifice another creature" }],
        ifDid: {
          kind: "reflexive-trigger",
          targets: ["creature-an-opponent-controls"],
          effect: { kind: "destroy", target: 0 },
          text: "When you do, destroy target creature an opponent controls.",
        },
      },
      resolve: null,
      text: "When this creature enters, you may sacrifice another creature. When you do, destroy target creature an opponent controls.",
    },
    {
      trigger: { on: "dies", who: "self" },
      targets: [
        {
          kind: "card-in-graveyard",
          whose: "you",
          filter: { type: "creature", manaValue: { op: "lte", n: 3 } },
        },
      ],
      effect: { kind: "put-onto-battlefield", target: 0, underYourControl: true },
      resolve: null,
      text: "When this creature dies, return target creature card with mana value 3 or less from your graveyard to the battlefield.",
    },
  ],
});
