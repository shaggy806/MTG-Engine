import { defineCard } from "../define.js";

const TEXT =
  "Constellation — Whenever an enchantment you control enters, put a +1/+1 counter on this creature and draw a card.";

// Gone before it resolves, it still draws (the ruling): the counter has
// nowhere to go, and the draw doesn't depend on it.
export default defineCard({
  name: "Setessan Champion",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Human", "Warrior"],
  power: 1,
  toughness: 3,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "enchantment" } },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
          { kind: "draw", amount: 1 },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
