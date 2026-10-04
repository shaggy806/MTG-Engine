import { defineCard } from "../define.js";

// EDHREC rank 2873.
// Makes Soldier → new token "Soldier Token (Finale of Glory)".
// Makes Angel → "4/4 Vigilant Angel Token".

export default defineCard({
  name: "Finale of Glory",
  manaCost: "{X}{W}{W}",
  colors: ["W"],
  types: ["sorcery"],
  text: "Create X 2/2 white Soldier creature tokens with vigilance. If X is 10 or more, also create X 4/4 white Angel creature tokens with flying and vigilance.",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "create-token", token: "Soldier Token (Finale of Glory)", count: "x" },
      {
        kind: "conditional",
        condition: { kind: "x", compare: { op: "gte", n: 10 } },
        then: { kind: "create-token", token: "4/4 Vigilant Angel Token", count: "x" },
      },
    ],
  },
});
