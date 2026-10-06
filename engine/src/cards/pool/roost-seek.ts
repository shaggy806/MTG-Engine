import { defineCard } from "../define.js";

// The Omen of Sagu Wildling (rule 720). The search shuffles the library, then
// the Omen is shuffled in as it resolves.
export default defineCard({
  name: "Roost Seek",
  manaCost: "{G}",
  colors: ["G"],
  types: ["sorcery"],
  subtypes: ["Omen"],
  text: "Search your library for a basic land card, reveal it, put it into your hand, then shuffle. (Also shuffle this card.)",
  effect: {
    kind: "search-library",
    filter: { supertype: "basic", type: "land" },
    min: 0,
    max: 1,
    destination: "hand",
    reveal: true,
  },
  faces: ["Sagu Wildling", "Roost Seek"],
  omen: true,
});
