import { defineCard } from "../define.js";

// Rulings:
//   [2008-05-01] The -1/-1 counter is put on Dusk Urchins during the declare attackers or
//     declare blockers step, whichever is appropriate, so it will be smaller by the time combat
//     damage is dealt.
//   [2008-05-01] If Dusk Urchins has just 1 toughness when it blocks, it will get a -1/-1 counter
//     and be put into the graveyard. The creature that it blocked remains blocked, however.

const COMBAT_TEXT = "Whenever this creature attacks or blocks, put a -1/-1 counter on it.";
const DIES_TEXT = "When this creature dies, draw a card for each -1/-1 counter on it.";

// Howling Golem's two triggers for "attacks or blocks"; the dies count is
// the counters it died with (last-known information — Aerith Gainsborough).
export default defineCard({
  name: "Dusk Urchins",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Ouphe"],
  power: 4,
  toughness: 3,
  text: `${COMBAT_TEXT}\n${DIES_TEXT}`,
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "-1/-1", amount: 1 },
      resolve: null,
      text: COMBAT_TEXT,
    },
    {
      trigger: { on: "blocks", who: "self" },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "-1/-1", amount: 1 },
      resolve: null,
      text: COMBAT_TEXT,
    },
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "draw", amount: { countersOn: "source", counter: "-1/-1" } },
      resolve: null,
      text: DIES_TEXT,
    },
  ],
});
