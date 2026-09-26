import { defineCard } from "../define.js";

const TEXT = "Whenever a token you control leaves the battlefield, each opponent loses 1 life and you gain 1 life.";

// Any departure — dying, exile, a bounce — and once per token, a stack of
// them counting every token in it.
export default defineCard({
  name: "Nadier's Nightblade",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Elf", "Warrior"],
  power: 1,
  toughness: 3,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "leaves-battlefield", who: "you-control", filter: { token: true } },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "lose-life", amount: 1, who: "each-opponent" },
          { kind: "gain-life", amount: 1 },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
