import { defineCard } from "../define.js";

const YOURS = { type: "creature", controlledBy: "you" } as const;

// X is read once, as the pump applies (rule 608.2h) — the trample grant
// before it changes no creature's power, so it can't move X.
export default defineCard({
  name: "Overwhelming Stampede",
  manaCost: "{3}{G}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text:
    "Until end of turn, creatures you control gain trample and get +X/+X, where X is the greatest power among creatures you control.",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "grant-keyword-all", filter: YOURS, keyword: "trample", duration: "end-of-turn" },
      {
        kind: "modify-pt-all",
        filter: YOURS,
        power: { aggregate: "max", of: "power", filter: YOURS },
        toughness: { aggregate: "max", of: "power", filter: YOURS },
        duration: "end-of-turn",
      },
    ],
  },
});
