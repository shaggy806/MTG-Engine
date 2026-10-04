import { defineCard } from "../define.js";

// EDHREC rank 5065.
//
// Rulings:
//   [2023-02-04] An ability that triggers "Whenever you proliferate" triggers even if you chose no
//     permanents or players while doing so.
//   [2023-02-04] To proliferate, you can choose any permanent that has a counter, including ones
//     controlled by opponents. You can choose any player who has a counter, including opponents.
//     You can't choose cards in any zone other than the battlefield, even if they have counters on
//     them.
//   [2023-02-04] Players can respond to a spell or ability whose effect includes proliferating.
//     Once that spell or ability starts to resolve, however, and its controller chooses which
//     permanents and players will get new counters, it's too late for anyone to respond.
//   [2023-02-04] You don't have to choose every permanent or player that has a counter, only the
//     ones you want to add another counter to. Since "any number" includes zero, you don't have to
//     choose any permanents at all, and you don't have to choose any players at all.
//   [2023-02-04] If a player or permanent has more than one kind of counter on it, and you choose
//     for it to get additional counters, it must get one of each kind of counter it already has.
//     You can't have it get just one kind of counter it already has and not the others.
//   [2023-02-04] If a permanent ever has both +1/+1 counters and -1/-1 counters on it at the same
//     time, they're removed in pairs as a state-based action so that the permanent has only one of
//     those kinds of counters on it.

// Reanimate's shape, then proliferate.
export default defineCard({
  name: "Vat Emergence",
  manaCost: "{4}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "Put target creature card from a graveyard onto the battlefield under your control. Proliferate. (Choose any number of permanents and/or players, then give each another counter of each kind already there.)",
  targets: [{ kind: "card-in-graveyard", filter: { type: "creature" } }],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "put-onto-battlefield", target: 0, underYourControl: true },
      { kind: "proliferate" },
    ],
  },
});
