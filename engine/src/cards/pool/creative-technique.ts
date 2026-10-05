import { demonstrate } from "../helpers.js";
import { defineCard } from "../define.js";

// Revealed, not exiled, as it goes: only the card found is exiled, and the
// rest go to the bottom before it may be cast (free — X is 0).
const TEXT =
  "Shuffle your library, then reveal cards from the top of it until you reveal a nonland card. Exile that card " +
  "and put the rest on the bottom of your library in a random order. You may cast the exiled card without paying " +
  "its mana cost.";

export default defineCard({
  name: "Creative Technique",
  manaCost: "{4}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: `Demonstrate (When you cast this spell, you may copy it. If you do, choose an opponent to also copy it.)\n${TEXT}`,
  targets: [],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "shuffle-library" },
      {
        kind: "reveal-until",
        filter: { notTypes: ["land"] },
        then: { kind: "exile", target: 0 },
        rest: "bottom-random",
      },
      { kind: "cast-now", from: "exiled-this-way", free: true },
    ],
  },
  triggered: [demonstrate()],
});
