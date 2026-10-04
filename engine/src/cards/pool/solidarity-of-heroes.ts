import { defineCard } from "../define.js";

// EDHREC rank 6256.
//
// Rulings:
//   [2014-04-26] Solidarity of Heroes can target any creatures, not just ones with +1/+1 counters
//     on them. Notably, heroic abilities of any target creatures that put +1/+1 counters on that
//     creature will resolve before Solidarity of Heroes.
//   [2014-04-26] If all of the spell's targets are illegal when the spell tries to resolve, it
//     won't resolve and none of its effects will happen. If one or more of its targets are legal
//     when it tries to resolve, the spell will resolve and affect only those legal targets. It
//     will have no effect on any illegal targets.
//   [2014-04-26] You choose how many targets each spell with a strive ability has and what those
//     targets are as you cast it. It's legal to cast such a spell with no targets, although this
//     is rarely a good idea. You can't choose the same target more than once for a single strive
//     spell.
//   [2014-04-26] If a spell or ability allows you to cast a strive spell without paying its mana
//     cost, you must pay the additional costs for any targets beyond the first.
//   [2014-04-26] If such a spell is copied, and the effect that copies the spell allows a player
//     to choose new targets for the copy, the number of targets can't be changed. The player may
//     change any number of the targets, including all of them or none of them. If, for one of the
//     targets, the player can't choose a new legal target, then it remains unchanged (even if the
//     current target is illegal).
//   [2014-04-26] The mana cost and mana value of strive spells don't change no matter how many
//     targets they have. Strive abilities affect only what you pay.

// Strive is `costPerExtraTarget` (Twinflame); Deepglow Skate's per-target
// doubling, narrowed to +1/+1 counters.
export default defineCard({
  name: "Solidarity of Heroes",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["instant"],
  text:
    "Strive — This spell costs {1}{G} more to cast for each target beyond the first.\n" +
    "Choose any number of target creatures. Double the number of +1/+1 counters on each of them.",
  costPerExtraTarget: "{1}{G}",
  targets: [{ kind: "any-number", of: "creature" }],
  effect: {
    kind: "for-each-target",
    from: 0,
    effect: { kind: "double-counters", target: 0, counter: "+1/+1" },
  },
});
