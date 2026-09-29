import { defineCard } from "../define.js";

const TEXT =
  "Reveal the top X cards of your library. You may put any number of permanent cards with mana " +
  "value X or less from among them onto the battlefield. Then put all cards revealed this way " +
  "that weren't put onto the battlefield into your graveyard.";

export default defineCard({
  name: "Genesis Wave",
  manaCost: "{X}{G}{G}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: TEXT,
  effect: {
    kind: "look-and-choose",
    zone: "library",
    count: "x",
    reveal: true,
    min: 0,
    max: "x",
    destination: "battlefield",
    leftover: "graveyard",
    filter: {
      typesAnyOf: ["artifact", "creature", "enchantment", "land", "planeswalker", "battle"],
      manaValue: { op: "lte", n: { amount: "x" } },
    },
  },
});
