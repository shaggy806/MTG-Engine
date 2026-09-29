import { defineCard } from "../define.js";

const TEXT =
  "At the beginning of your upkeep, reveal the top card of your library and put that card into your hand. You lose life equal to its mana value.";

// Put into your hand, not drawn — as Darkstar Augur.
export default defineCard({
  name: "Dark Confidant",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 2,
  toughness: 1,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: {
        kind: "look-and-choose",
        zone: "library",
        count: 1,
        min: 1,
        max: 1,
        destination: "hand",
        leftover: "stay",
        reveal: true,
        then: { kind: "lose-life", who: "you", amount: { manaValueOf: 0 } },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
