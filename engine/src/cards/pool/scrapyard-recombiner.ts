import { defineCard } from "../define.js";

// EDHREC rank 6366.
//
// Rulings:
//   [2019-06-14] If a creature with modular receives enough -1/-1 counters to cause it to be
//     destroyed by lethal damage or put into its owner’s graveyard for having 0 or less toughness,
//     modular will put a number of +1/+1 counters on the target artifact creature equal to the
//     number of +1/+1 counters on this creature before it left the battlefield. That’s because
//     modular checks the creature as it last existed on the battlefield, and it still had +1/+1
//     counters on it at that point.
//   [2019-06-14] You can sacrifice Scrapyard Recombiner to pay the cost of its second ability.

const MODULAR_TEXT =
  "Modular 2 (This creature enters with two +1/+1 counters on it. When it dies, you may put its +1/+1 counters on target artifact creature.)";
const SEARCH_TEXT =
  "{T}, Sacrifice an artifact: Search your library for a Construct card, reveal it, put it into your hand, then shuffle.";

export default defineCard({
  name: "Scrapyard Recombiner",
  manaCost: "{3}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Construct"],
  power: 0,
  toughness: 0,
  text: `${MODULAR_TEXT}\n${SEARCH_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true, sacrifice: { filter: { type: "artifact" } } },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { subtype: "Construct" },
        destination: "hand",
        min: 0,
        max: 1,
        reveal: true,
      },
      resolve: null,
      text: SEARCH_TEXT,
    },
  ],
  // Modular — Arcbound Ravager's shape.
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", counters: { kind: "+1/+1", amount: 2 } },
      text: MODULAR_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [{ kind: "permanent", filter: { types: ["artifact", "creature"] } }],
      effect: {
        kind: "may",
        prompt: "Put this creature's +1/+1 counters on target artifact creature?",
        effect: {
          kind: "add-counter",
          target: 0,
          counter: "+1/+1",
          amount: { countersOn: "source", counter: "+1/+1" },
        },
      },
      resolve: null,
      text: MODULAR_TEXT,
    },
  ],
});
