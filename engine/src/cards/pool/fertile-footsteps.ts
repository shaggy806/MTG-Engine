import { defineCard } from "../define.js";

/** The adventure half of Beanstalk Giant. */
export default defineCard({
  name: "Fertile Footsteps",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["sorcery"],
  subtypes: ["Adventure"],
  text:
    "Search your library for a basic land card, put it onto the battlefield, then shuffle. " +
    "(Then exile this card. You may cast the creature later from exile.)",
  effect: {
    kind: "search-library",
    filter: { type: "land", supertype: "basic" },
    destination: "battlefield",
    min: 0,
    max: 1,
  },
  faces: ["Beanstalk Giant", "Fertile Footsteps"],
  adventure: true,
});
