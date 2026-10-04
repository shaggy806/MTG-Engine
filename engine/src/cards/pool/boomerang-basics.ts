import { defineCard } from "../define.js";

// EDHREC rank 4326.

export default defineCard({
  name: "Boomerang Basics",
  manaCost: "{U}",
  colors: ["U"],
  types: ["sorcery"],
  subtypes: ["Lesson"],
  text: "Return target nonland permanent to its owner's hand. If you controlled that permanent, draw a card.",
  targets: ["nonland-permanent"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "return-to-hand", target: 0 },
      {
        // The target, gone by now, is matched as it last existed on the
        // battlefield — who controlled it then — whatever zone it went to.
        kind: "conditional",
        condition: { kind: "target", index: 0, filter: { controlledBy: "you" } },
        then: { kind: "draw", amount: 1 },
      },
    ],
  },
});
