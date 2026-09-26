import { defineCard } from "../define.js";

// The sacrifice is part of the cost (so no creature, no cast — the ruling),
// and "the sacrificed creature's mana value" is read as it last existed on
// the battlefield (rule 608.2h).
export default defineCard({
  name: "Eldritch Evolution",
  manaCost: "{1}{G}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text:
    "As an additional cost to cast this spell, sacrifice a creature.\n" +
    "Search your library for a creature card with mana value X or less, where X is 2 plus the sacrificed " +
    "creature's mana value. Put that card onto the battlefield, then shuffle. Exile Eldritch Evolution.",
  additionalCost: { sacrifice: { type: "creature", controlledBy: "you" } },
  effect: {
    kind: "search-library",
    filter: {
      type: "creature",
      manaValue: { op: "lte", n: { amount: { sum: [{ manaValueOf: "sacrificed" }, 2] } } },
    },
    destination: "battlefield",
    min: 0,
    max: 1,
  },
  exileOnResolve: true,
});
