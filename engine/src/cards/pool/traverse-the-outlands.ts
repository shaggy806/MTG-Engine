import { defineCard } from "../define.js";

const YOURS = { type: "creature", controlledBy: "you" } as const;

// X is read as it resolves (rule 608.2h).
export default defineCard({
  name: "Traverse the Outlands",
  manaCost: "{4}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text:
    "Search your library for up to X basic land cards, where X is the greatest power among creatures you control. Put those cards onto the battlefield tapped, then shuffle.",
  effect: {
    kind: "search-library",
    filter: { type: "land", supertype: "basic" },
    destination: "battlefield",
    enterTapped: true,
    min: 0,
    max: { aggregate: "max", of: "power", filter: YOURS },
  },
});
