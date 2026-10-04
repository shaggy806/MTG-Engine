import { defineCard } from "../define.js";

// EDHREC rank 4591.
//
// Rulings:
//   [2011-06-01] You may choose the creature you put the -1/-1 counter on to get another -1/-1
//     counter when proliferating.
//   [2023-02-04] An ability that triggers "Whenever you proliferate" triggers even if you chose no
//     permanents or players while doing so.
//   [2023-02-04] You don't have to choose every permanent or player that has a counter, only the
//     ones you want to add another counter to. Since "any number" includes zero, you don't have to
//     choose any permanents at all, and you don't have to choose any players at all.
//   [2023-02-04] To proliferate, you can choose any permanent that has a counter, including ones
//     controlled by opponents. You can choose any player who has a counter, including opponents.
//     You can't choose cards in any zone other than the battlefield, even if they have counters on
//     them.
//   [2023-02-04] If a permanent ever has both +1/+1 counters and -1/-1 counters on it at the same
//     time, they're removed in pairs as a state-based action so that the permanent has only one of
//     those kinds of counters on it.
//   [2023-02-04] If a player or permanent has more than one kind of counter on it, and you choose
//     for it to get additional counters, it must get one of each kind of counter it already has.
//     You can't have it get just one kind of counter it already has and not the others.
//   [2023-02-04] Players can respond to a spell or ability whose effect includes proliferating.
//     Once that spell or ability starts to resolve, however, and its controller chooses which
//     permanents and players will get new counters, it's too late for anyone to respond.

export default defineCard({
  name: "Grim Affliction",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["instant"],
  text: "Put a -1/-1 counter on target creature, then proliferate. (Choose any number of permanents and/or players, then give each another counter of each kind already there.)",
  targets: ["creature"],
  // Atomize's shape: the counter, then the proliferate decision.
  effect: {
    kind: "sequence",
    effects: [{ kind: "add-counter", target: 0, counter: "-1/-1", amount: 1 }, { kind: "proliferate" }],
  },
});
