import { defineCard } from "../define.js";

// EDHREC rank 4570.
//
// Rulings:
//   [2023-02-04] If a player or permanent has more than one kind of counter on it, and you choose
//     for it to get additional counters, it must get one of each kind of counter it already has.
//     You can't have it get just one kind of counter it already has and not the others.
//   [2023-02-04] If a permanent ever has both +1/+1 counters and -1/-1 counters on it at the same
//     time, they're removed in pairs as a state-based action so that the permanent has only one of
//     those kinds of counters on it.
//   [2023-02-04] Players can respond to a spell or ability whose effect includes proliferating.
//     Once that spell or ability starts to resolve, however, and its controller chooses which
//     permanents and players will get new counters, it's too late for anyone to respond.
//   [2023-02-04] To proliferate, you can choose any permanent that has a counter, including ones
//     controlled by opponents. You can choose any player who has a counter, including opponents.
//     You can't choose cards in any zone other than the battlefield, even if they have counters on
//     them.
//   [2023-02-04] You don't have to choose every permanent or player that has a counter, only the
//     ones you want to add another counter to. Since "any number" includes zero, you don't have to
//     choose any permanents at all, and you don't have to choose any players at all.
//   [2023-02-04] An ability that triggers "Whenever you proliferate" triggers even if you chose no
//     permanents or players while doing so.

// "If that permanent had mana value 3 or less" reads the target as it last
// existed on the battlefield (the `target` condition, rule 608.2h), so a
// token that ceased to exist or a commander sent to the command zone still
// counts. The proliferate is Atomize's.
export default defineCard({
  name: "Serum Snare",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Return target nonland permanent to its owner's hand. If that permanent had mana value 3 or less, proliferate. (Choose any number of permanents and/or players, then give each another counter of each kind already there.)",
  targets: ["nonland-permanent"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "return-to-hand", target: 0 },
      {
        kind: "conditional",
        condition: { kind: "target", index: 0, filter: { manaValue: { op: "lte", n: 3 } } },
        then: { kind: "proliferate" },
      },
    ],
  },
});
