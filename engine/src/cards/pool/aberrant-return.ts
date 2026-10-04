import type { TargetSpec } from "../../target.js";
import { defineCard } from "../define.js";
import { distinctTargets } from "../helpers.js";

// EDHREC rank 6132.
//
// "One, two, or three target creature cards from graveyards": one required
// slot and two optional ones, all distinct (rule 601.2c). They enter together
// (Afterlife from the Loam's `simultaneous`), each with its -1/-1 counter
// (`withCounters`, Undying's shape).

const TEXT =
  "Put one, two, or three target creature cards from graveyards onto the battlefield under your control. " +
  "Each of them enters with an additional -1/-1 counter on it.";

const CREATURE_CARD: TargetSpec = { kind: "card-in-graveyard", whose: "any", filter: { type: "creature" } };

export default defineCard({
  name: "Aberrant Return",
  manaCost: "{4}{B}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: TEXT,
  targets: [CREATURE_CARD, ...distinctTargets(2, CREATURE_CARD, { optional: true, from: 1, otherThan: [0] })],
  effect: {
    kind: "sequence",
    simultaneous: true,
    effects: [0, 1, 2].map((slot) => ({
      kind: "put-onto-battlefield" as const,
      target: slot,
      underYourControl: true,
      withCounters: { kind: "-1/-1", amount: 1 },
    })),
  },
});
