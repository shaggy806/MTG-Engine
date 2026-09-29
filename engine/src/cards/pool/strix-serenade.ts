import { defineCard } from "../define.js";

// The Bird is made first, while the spell is still on the stack under the
// player who controls it: once countered, a card cast by someone other than
// its owner is back in its owner's graveyard, and a copy has ceased to
// exist. A spell that can't be countered still gets its controller a Bird
// (the ruling).
export default defineCard({
  name: "Strix Serenade",
  manaCost: "{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Counter target artifact, creature, or planeswalker spell. Its controller creates a 2/2 blue Bird creature token with flying.",
  targets: [{ kind: "spell", filter: { typesAnyOf: ["artifact", "creature", "planeswalker"] } }],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "create-token", token: "2/2 Blue Bird Token", count: 1, who: "target-controller" },
      { kind: "counter", target: 0 },
    ],
  },
});
