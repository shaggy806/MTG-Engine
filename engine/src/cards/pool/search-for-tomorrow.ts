import { defineCard } from "../define.js";

export default defineCard({
  name: "Search for Tomorrow",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["sorcery"],
  suspend: { n: 2, cost: "{G}" },
  text:
    "Search your library for a basic land card, put it onto the battlefield, then shuffle.\n" +
    "Suspend 2—{G} (Rather than cast this card from your hand, you may pay {G} and exile it with two time counters on it. At the beginning of your upkeep, remove a time counter. When the last is removed, you may cast it without paying its mana cost.)",
  effect: {
    kind: "search-library",
    filter: { type: "land", supertype: "basic" },
    destination: "battlefield",
    min: 0,
    max: 1,
  },
});
