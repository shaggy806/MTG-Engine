import { defineCard } from "../define.js";

const TEXT =
  "Whenever one or more artifacts you control enter, this creature deals that much damage to each opponent.";

export default defineCard({
  name: "Ingenious Artillerist",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Artificer"],
  power: 3,
  toughness: 1,
  text: TEXT,
  triggered: [
    {
      // "That much": how many artifacts the entry brought.
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "artifact" }, batched: true },
      targets: [],
      effect: { kind: "damage", amount: { triggerValue: true }, who: "each-opponent" },
      resolve: null,
      text: TEXT,
    },
  ],
});
