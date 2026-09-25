import { defineCard } from "../define.js";

// Rulings:
//   [2015-11-04] If a creature card in your graveyard has {X} in its mana cost, X is 0.
//   [2015-11-04] Experience counters are the second kind of counters a player can have, joining
//     poison.
//   [2015-11-04] Each game pack includes a card labeled “Experience” with the suggestion “Place
//     your experience counters here.” This card isn’t required for play. It’s simply a convenient
//     spot to put your experience counters, which can be represented with dice, glass beads, or
//     other small items.
//   [2015-11-04] If Meren of Clan Nel Toth leaves the battlefield at the same time as other
//     creatures you control die, its first ability will trigger for each of those creatures.
//   [2015-11-04] You can’t choose to put the creature card into your hand if its mana value is
//     less than or equal to the number of experience counters you have as the ability resolves.
//   [2015-11-04] All experience counters are identical, no matter how you got them. For example,
//     the last ability will count experience counters that you got from the first ability, from
//     another ability, from proliferating, and so on.

export default defineCard({
  name: "Meren of Clan Nel Toth",
  manaCost: "{2}{B}{G}",
  colors: ["B", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Shaman"],
  power: 3,
  toughness: 4,
  text: "Whenever another creature you control dies, you get an experience counter.\nAt the beginning of your end step, choose target creature card in your graveyard. If that card's mana value is less than or equal to the number of experience counters you have, return it to the battlefield. Otherwise, put it into your hand.",
  triggered: [
    {
      trigger: { on: "dies", who: "you-control", filter: { type: "creature" }, otherOnly: true },
      targets: [],
      effect: { kind: "add-player-counters", counter: "experience", amount: 1 },
      resolve: null,
      text: "Whenever another creature you control dies, you get an experience counter.",
    },
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "creature" } }],
      // The comparison is made as it resolves, against the counters you have then.
      effect: {
        kind: "conditional",
        condition: {
          kind: "target",
          index: 0,
          filter: { manaValue: { op: "lte", n: { amount: { playerCounters: "experience" } } } },
        },
        then: { kind: "put-onto-battlefield", target: 0 },
        else: { kind: "return-to-hand", target: 0, from: "graveyard" },
      },
      resolve: null,
      text: "At the beginning of your end step, choose target creature card in your graveyard. If that card's mana value is less than or equal to the number of experience counters you have, return it to the battlefield. Otherwise, put it into your hand.",
    },
  ],
});
