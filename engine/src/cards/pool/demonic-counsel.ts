import { defineCard } from "../define.js";

// Delirium is checked as it resolves; "instead" means only the one search.
// "Any card" has no quality, so one must be found while there is one (rule
// 701.23d); "a Demon card" has one, and may be missed (701.23b).
export default defineCard({
  name: "Demonic Counsel",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text:
    "Search your library for a Demon card, reveal it, put it into your hand, then shuffle.\n" +
    "Delirium — If there are four or more card types among cards in your graveyard, instead search your library for any card, put it into your hand, then shuffle.",
  effect: {
    kind: "conditional",
    condition: { kind: "delirium" },
    then: { kind: "search-library", filter: {}, destination: "hand", min: 1, max: 1 },
    else: { kind: "search-library", filter: { subtype: "Demon" }, destination: "hand", reveal: true, min: 0, max: 1 },
  },
});
