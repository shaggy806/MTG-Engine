import { defineCard } from "../define.js";

// The Omen of Bloomvine Regent (rule 720): Cultivate's split, over basic
// Forests. The search shuffles the library, then the Omen is shuffled in.
export default defineCard({
  name: "Claim Territory",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["sorcery"],
  subtypes: ["Omen"],
  text:
    "Search your library for up to two basic Forest cards, reveal them, put one onto the battlefield tapped and the other into your hand, then shuffle. (Also shuffle this card.)",
  effect: {
    kind: "search-library",
    filter: { supertype: "basic", type: "land", subtype: "Forest" },
    min: 0,
    max: 2,
    destination: "battlefield",
    enterTapped: true,
    restDestination: "hand",
    reveal: true,
  },
  faces: ["Bloomvine Regent", "Claim Territory"],
  omen: true,
});
