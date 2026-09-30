import { defineCard } from "../define.js";

export default defineCard({
  name: "Trading Post",
  manaCost: "{4}",
  types: ["artifact"],
  text:
    "{1}, {T}, Discard a card: You gain 4 life.\n" +
    "{1}, {T}, Pay 1 life: Create a 0/1 white Goat creature token.\n" +
    "{1}, {T}, Sacrifice a creature: Return target artifact card from your graveyard to your hand.\n" +
    "{1}, {T}, Sacrifice an artifact: Draw a card.",
  activated: [
    {
      cost: { mana: "{1}", tap: true, discard: { count: 1 } },
      targets: [],
      effect: { kind: "gain-life", amount: 4 },
      resolve: null,
      text: "{1}, {T}, Discard a card: You gain 4 life.",
    },
    {
      cost: { mana: "{1}", tap: true, payLife: 1 },
      targets: [],
      effect: { kind: "create-token", token: "Goat Token", count: 1 },
      resolve: null,
      text: "{1}, {T}, Pay 1 life: Create a 0/1 white Goat creature token.",
    },
    {
      cost: { mana: "{1}", tap: true, sacrifice: "creature-you-control" },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "artifact" } }],
      effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      resolve: null,
      text: "{1}, {T}, Sacrifice a creature: Return target artifact card from your graveyard to your hand.",
    },
    {
      cost: { mana: "{1}", tap: true, sacrifice: { filter: { type: "artifact" } } },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{1}, {T}, Sacrifice an artifact: Draw a card.",
    },
  ],
});
