import { defineCard } from "../define.js";

// EDHREC rank 6733.
//
// Prototype (rule 718) is `prototype` (Combat Thresher): cast for {3}{R}{R}
// it's a red 2/2 on the stack and the battlefield, a colorless 4/4
// everywhere else. The prototype characteristics are copiable values (rule
// 718.3c), so the two token copies of a prototyped Battalion are red 2/2s
// with its prototype mana cost too (the ruling). "If you cast it" is an
// intervening-if (rule 603.4 — Zacama's shape): the copies weren't cast, so
// theirs never triggers.

const ENTERS_TEXT = "When this creature enters, if you cast it, create two tokens that are copies of it.";

export default defineCard({
  name: "Skitterbeam Battalion",
  manaCost: "{9}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Construct"],
  power: 4,
  toughness: 4,
  keywords: ["trample", "haste"],
  text:
    "Prototype {3}{R}{R} — 2/2 (You may cast this spell with different mana cost, color, and size. " +
    "It keeps its abilities and types.)\n" +
    `Trample, haste\n${ENTERS_TEXT}`,
  prototype: { cost: "{3}{R}{R}", power: 2, toughness: 2 },
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      condition: { kind: "source", filter: { cast: true, castBy: "you" } },
      targets: [],
      effect: { kind: "create-token-copy", of: "source", count: 2, who: "you" },
      resolve: null,
      text: ENTERS_TEXT,
    },
  ],
});
