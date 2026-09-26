import { defineCard } from "../define.js";

// With no targets chosen it still destroys every creature; with targets
// that have all become illegal it does nothing at all (the ruling — rule
// 608.2b).
export default defineCard({
  name: "Singularity Rupture",
  manaCost: "{3}{U}{B}{B}",
  colors: ["U", "B"],
  types: ["sorcery"],
  text:
    "Destroy all creatures, then any number of target players each mill half their library, rounded down.",
  targets: [{ kind: "any-number", of: "player" }],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "destroy-all", filter: { type: "creature" } },
      {
        kind: "for-each-target",
        from: 0,
        effect: { kind: "mill", target: 0, amount: { half: { librarySize: "each" }, round: "down" } },
        simultaneous: true,
      },
    ],
  },
});
