import { defineCard } from "../define.js";

// The death trigger is Zulaport Cutthroat's, minus the source: an enchantment
// can't be one of the creatures it counts. Neither half targets, so a
// hexproof opponent still loses the life.
export default defineCard({
  name: "Bastion of Remembrance",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["enchantment"],
  text:
    "When this enchantment enters, create a 1/1 white Human Soldier creature token.\n" +
    "Whenever a creature you control dies, each opponent loses 1 life and you gain 1 life.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Human Soldier Token", count: 1 },
      resolve: null,
      text: "When this enchantment enters, create a 1/1 white Human Soldier creature token.",
    },
    {
      trigger: { on: "dies", who: "you-control", filter: { type: "creature" } },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "lose-life", amount: 1, who: "each-opponent" },
          { kind: "gain-life", amount: 1 },
        ],
      },
      resolve: null,
      text: "Whenever a creature you control dies, each opponent loses 1 life and you gain 1 life.",
    },
  ],
});
