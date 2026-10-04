import { defineCard } from "../define.js";

// EDHREC rank 6219.
//
// Once per blocker (the `blocks` trigger); the Captain itself has defender,
// so its own block counts.
const TEXT = "Whenever a creature you control with defender blocks, you may gain 2 life.";

export default defineCard({
  name: "Perimeter Captain",
  manaCost: "{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 0,
  toughness: 4,
  keywords: ["defender"],
  text: `Defender\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "blocks", who: "you-control", filter: { type: "creature", keyword: "defender" } },
      targets: [],
      effect: { kind: "may", prompt: "Gain 2 life?", effect: { kind: "gain-life", amount: 2 } },
      resolve: null,
      text: TEXT,
    },
  ],
});
