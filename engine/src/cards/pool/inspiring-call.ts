import { defineCard } from "../define.js";
import type { CardFilter } from "../../filter.js";

const withCounter: CardFilter = {
  type: "creature",
  controlledBy: "you",
  counters: { kind: "+1/+1", compare: { op: "gte", n: 1 } },
};

export default defineCard({
  name: "Inspiring Call",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["instant"],
  text:
    "Draw a card for each creature you control with a +1/+1 counter on it. Those creatures " +
    'gain indestructible until end of turn. (Damage and effects that say "destroy" don\'t ' +
    "destroy them.)",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "draw", amount: { countOf: withCounter } },
      // "Those creatures" — the same set, read again straight after the draw.
      // Nothing can resolve in between, so it can't have changed. The grant is
      // a one-shot on the creatures matching now (the 2017-11-17 rulings: a
      // counter put on later doesn't earn it, and losing the counters later
      // doesn't take it away).
      { kind: "grant-keyword-all", filter: withCounter, keyword: "indestructible", duration: "end-of-turn" },
    ],
  },
});
