import { defineCard } from "../define.js";

// EDHREC rank 1225.
//
// - The 0's counter goes only on a target that's an artifact creature as it
//   resolves (matched as it last existed, if it's gone by then).
// - The emblem's artifact keeps every ability, type and subtype it had
//   (its ruling); one that isn't a creature becomes a 0/0 Robot artifact
//   creature for good — a Vehicle's base P/T 0/0, which crewing won't
//   restore, and no "becomes crewed" (its rulings) — counters on it first.
const ARTIFACT = "Whenever an artifact you control enters, put a loyalty counter on Tezzeret.";
const ZERO = "0: Untap target artifact or creature. If it's an artifact creature, put a +1/+1 counter on it.";
const MINUS =
  "−3: Search your library for an artifact card with mana value 1 or less, reveal it, put it into your hand, then shuffle.";
const EMBLEM =
  "At the beginning of combat on your turn, put three +1/+1 counters on target artifact you control. If it's not a creature, it becomes a 0/0 Robot artifact creature.";
const ULTIMATE = `−7: You get an emblem with "${EMBLEM}"`;

export default defineCard({
  name: "Tezzeret, Cruel Captain",
  manaCost: "{3}",
  colors: [],
  supertypes: ["legendary"],
  types: ["planeswalker"],
  subtypes: ["Tezzeret"],
  loyalty: 4,
  text: `${ARTIFACT}\n${ZERO}\n${MINUS}\n${ULTIMATE}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "artifact" } },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "loyalty", amount: 1 },
      resolve: null,
      text: ARTIFACT,
    },
  ],
  activated: [
    {
      loyaltyCost: 0,
      cost: { mana: null, tap: false },
      targets: [{ kind: "permanent", filter: { typesAnyOf: ["artifact", "creature"] } }],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "untap", target: 0 },
          {
            kind: "conditional",
            condition: { kind: "target", index: 0, filter: { types: ["artifact", "creature"] } },
            then: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
          },
        ],
      },
      resolve: null,
      text: ZERO,
    },
    {
      loyaltyCost: -3,
      cost: { mana: null, tap: false },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { type: "artifact", manaValue: { op: "lte", n: 1 } },
        destination: "hand",
        min: 0,
        max: 1,
        reveal: true,
      },
      resolve: null,
      text: MINUS,
    },
    {
      loyaltyCost: -7,
      cost: { mana: null, tap: false },
      targets: [],
      effect: {
        kind: "create-emblem",
        text: EMBLEM,
        triggered: [
          {
            trigger: { on: "step-begins", step: "begin-combat", who: "you" },
            targets: [{ kind: "permanent", filter: { type: "artifact", controlledBy: "you" } }],
            effect: {
              kind: "sequence",
              effects: [
                { kind: "add-counter", target: 0, counter: "+1/+1", amount: 3 },
                {
                  kind: "conditional",
                  condition: { kind: "target", index: 0, filter: { notTypes: ["creature"] } },
                  then: {
                    kind: "animate",
                    target: 0,
                    power: 0,
                    toughness: 0,
                    addTypes: ["creature"],
                    addSubtypes: ["Robot"],
                    duration: "permanent",
                  },
                },
              ],
            },
            resolve: null,
            text: EMBLEM,
          },
        ],
      },
      resolve: null,
      text: ULTIMATE,
    },
  ],
});
