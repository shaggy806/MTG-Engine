import { defineCard } from "../define.js";

// Spree (rule 702.172a): each chosen mode's cost is added to {U}, and the
// modes resolve in the order printed (the rulings). The token copies the
// permanent's copiable values only — no counters, tapped state or other
// effects (rule 707.2).
export default defineCard({
  name: "Three Steps Ahead",
  manaCost: "{U}",
  colors: ["U"],
  types: ["instant"],
  text:
    "Spree (Choose one or more additional costs.)\n" +
    "+ {1}{U} — Counter target spell.\n" +
    "+ {3} — Create a token that's a copy of target artifact or creature you control.\n" +
    "+ {2} — Draw two cards, then discard a card.",
  castModal: {
    minModes: 1,
    maxModes: 3,
    modes: [
      {
        text: "+ {1}{U} — Counter target spell.",
        spreeCost: "{1}{U}",
        targets: ["spell"],
        effect: { kind: "counter", target: 0 },
      },
      {
        text: "+ {3} — Create a token that's a copy of target artifact or creature you control.",
        spreeCost: "{3}",
        targets: [{ kind: "permanent", whose: "you", filter: { typesAnyOf: ["artifact", "creature"] } }],
        effect: { kind: "create-token-copy", of: 0, count: 1, who: "you" },
      },
      {
        text: "+ {2} — Draw two cards, then discard a card.",
        spreeCost: "{2}",
        effect: {
          kind: "sequence",
          effects: [{ kind: "draw", amount: 2 }, { kind: "discard", target: "you", amount: 1 }],
        },
      },
    ],
  },
});
