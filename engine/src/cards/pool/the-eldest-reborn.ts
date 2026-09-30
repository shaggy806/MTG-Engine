import { defineCard } from "../define.js";

export default defineCard({
  name: "The Eldest Reborn",
  manaCost: "{4}{B}",
  colors: ["B"],
  types: ["enchantment"],
  subtypes: ["Saga"],
  text:
    "(As this Saga enters and after your draw step, add a lore counter. Sacrifice after III.)\n" +
    "I — Each opponent sacrifices a creature or planeswalker of their choice.\n" +
    "II — Each opponent discards a card.\n" +
    "III — Put target creature or planeswalker card from a graveyard onto the battlefield under your control.",
  chapters: [
    {
      at: [1],
      targets: [],
      effect: {
        kind: "sacrifice",
        who: "each-opponent",
        filter: { typesAnyOf: ["creature", "planeswalker"] },
        count: 1,
      },
      resolve: null,
      text: "I — Each opponent sacrifices a creature or planeswalker of their choice.",
    },
    {
      at: [2],
      targets: [],
      effect: { kind: "discard", target: "each-opponent", amount: 1 },
      resolve: null,
      text: "II — Each opponent discards a card.",
    },
    {
      at: [3],
      targets: [{ kind: "card-in-graveyard", filter: { typesAnyOf: ["creature", "planeswalker"] } }],
      effect: { kind: "put-onto-battlefield", target: 0, underYourControl: true },
      resolve: null,
      text: "III — Put target creature or planeswalker card from a graveyard onto the battlefield under your control.",
    },
  ],
});
