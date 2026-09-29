import { defineCard } from "../define.js";

export default defineCard({
  name: "Staff of Compleation",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text:
    "{T}, Pay 1 life: Destroy target permanent you own.\n" +
    "{T}, Pay 2 life: Add one mana of any color.\n" +
    "{T}, Pay 3 life: Proliferate.\n" +
    "{T}, Pay 4 life: Draw a card.\n" +
    "{5}: Untap this artifact.",
  activated: [
    {
      cost: { mana: null, tap: true, payLife: 1 },
      targets: [{ kind: "permanent", filter: { ownedBy: "you" } }],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: "{T}, Pay 1 life: Destroy target permanent you own.",
    },
    {
      cost: { mana: null, tap: true, payLife: 2 },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      text: "{T}, Pay 2 life: Add one mana of any color.",
    },
    {
      cost: { mana: null, tap: true, payLife: 3 },
      targets: [],
      effect: { kind: "proliferate" },
      resolve: null,
      text: "{T}, Pay 3 life: Proliferate.",
    },
    {
      cost: { mana: null, tap: true, payLife: 4 },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{T}, Pay 4 life: Draw a card.",
    },
    {
      cost: { mana: "{5}", tap: false },
      targets: [],
      effect: { kind: "untap", target: "source" },
      resolve: null,
      text: "{5}: Untap this artifact.",
    },
  ],
});
