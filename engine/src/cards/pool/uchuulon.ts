import { defineCard } from "../define.js";

// EDHREC rank 4843.

export default defineCard({
  name: "Uchuulon",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Crab", "Ooze", "Horror"],
  power: 0,
  toughness: 4,
  text: "Uchuulon's power is equal to the number of Crabs, Oozes, and/or Horrors you control.\nHorrific Symbiosis — At the beginning of your end step, exile up to one target creature card from an opponent's graveyard. If you do, create a token that's a copy of this creature.",
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      targets: [
        { kind: "optional", of: { kind: "card-in-graveyard", whose: "opponent", filter: { type: "creature" } } },
      ],
      // "If you do" is the exile having happened; "this creature" is copied
      // as it last existed if it has left (rule 608.2h).
      effect: {
        kind: "sequence",
        effects: [
          { kind: "exile", target: 0 },
          {
            kind: "conditional",
            condition: { kind: "this-way", what: "exiled" },
            then: { kind: "create-token-copy", of: "source", count: 1 },
          },
        ],
      },
      resolve: null,
      text: "Horrific Symbiosis — At the beginning of your end step, exile up to one target creature card from an opponent's graveyard. If you do, create a token that's a copy of this creature.",
    },
  ],
  static: [
    {
      // A characteristic-defining ability (rule 604.3), Adeline's shape —
      // it counts itself while it's on the battlefield.
      affects: { scope: "self" },
      setBasePtFromCount: {
        countOf: { countOf: { subtypes: ["Crab", "Ooze", "Horror"], controlledBy: "you" } },
        plusPower: 0,
        plusToughness: 0,
        only: "power",
      },
      text: "Uchuulon's power is equal to the number of Crabs, Oozes, and/or Horrors you control.",
    },
  ],
});
