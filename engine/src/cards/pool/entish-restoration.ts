import { defineCard } from "../define.js";
import type { EffectSpec } from "../../effects.js";

// The sacrifice is part of the resolution, not an additional cost: a
// countered Entish Restoration sacrifices nothing (2023-06-16 ruling). The
// search doesn't depend on it ("Sacrifice a land. Search …", no "if you do").
const search = (max: number): EffectSpec => ({
  kind: "search-library",
  filter: { type: "land", supertype: "basic" },
  destination: "battlefield",
  min: 0,
  max,
  enterTapped: true,
});

export default defineCard({
  name: "Entish Restoration",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["instant"],
  text:
    "Sacrifice a land. Search your library for up to two basic land cards, put them onto the " +
    "battlefield tapped, then shuffle. If you control a creature with power 4 or greater, instead " +
    "search your library for up to three basic land cards, put them onto the battlefield tapped, then shuffle.",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "sacrifice", who: "you", filter: { type: "land" }, count: 1 },
      {
        kind: "conditional",
        condition: {
          kind: "controls",
          filter: { type: "creature", power: { op: "gte", n: 4 } },
          atLeast: 1,
        },
        then: search(3),
        else: search(2),
      },
    ],
  },
});
