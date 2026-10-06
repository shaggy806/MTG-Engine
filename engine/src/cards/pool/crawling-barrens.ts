import { defineCard } from "../define.js";

// Rulings:
//   [2024-11-08] Counters on Crawling Barrens remain on it when it stops being a creature. If it
//     becomes a creature later, they'll apply to it.
//   [2024-11-08] You can activate Crawling Barrens's second ability even if it's already a
//     creature.
//   [2024-11-08] Unless Crawling Barrens is already a creature, its second ability causes the
//     +1/+1 counters to be put onto a noncreature land.
//
// The counters go on first, then the optional animation — a 0/0 base the
// counters then size (layer 7c over 7b). No colour is set: it stays colourless.
const GROW_TEXT =
  "{4}: Put two +1/+1 counters on this land. Then you may have it become a 0/0 Elemental creature until end of turn. It's still a land.";

export default defineCard({
  name: "Crawling Barrens",
  colors: [],
  types: ["land"],
  text: `{T}: Add {C}.\n${GROW_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: "{4}", tap: false },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "add-counter", target: "source", counter: "+1/+1", amount: 2 },
          {
            kind: "may",
            prompt: "Have Crawling Barrens become a 0/0 Elemental creature until end of turn?",
            effect: {
              kind: "animate",
              target: "source",
              power: 0,
              toughness: 0,
              addTypes: ["creature"],
              addSubtypes: ["Elemental"],
              duration: "end-of-turn",
            },
          },
        ],
      },
      resolve: null,
      text: GROW_TEXT,
    },
  ],
});
