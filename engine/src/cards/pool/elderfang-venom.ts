import { defineCard } from "../define.js";

// EDHREC rank 5577.
const STATIC_TEXT = "Attacking Elves you control have deathtouch.";
const DIES_TEXT = "Whenever an Elf you control dies, each opponent loses 1 life and you gain 1 life.";

export default defineCard({
  name: "Elderfang Venom",
  manaCost: "{2}{B}{G}",
  colors: ["B", "G"],
  types: ["enchantment"],
  text: `${STATIC_TEXT}\n${DIES_TEXT}`,
  static: [
    {
      affects: {
        scope: "filter",
        filter: { type: "creature", subtype: "Elf", attacking: true, controlledBy: "you" },
      },
      grantKeywords: ["deathtouch"],
      text: STATIC_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "dies", who: "you-control", filter: { subtype: "Elf" } },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "lose-life", amount: 1, who: "each-opponent" },
          { kind: "gain-life", amount: 1 },
        ],
      },
      resolve: null,
      text: DIES_TEXT,
    },
  ],
});
