import { defineCard } from "../define.js";

const TEXT = "When this creature enters, search your library for a card, put that card into your graveyard, then shuffle.";

export default defineCard({
  name: "Vile Entomber",
  manaCost: "{2}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie", "Warlock"],
  power: 2,
  toughness: 2,
  keywords: ["deathtouch"],
  text: `Deathtouch\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      // "A card", no quality: one must be found while there is one (701.23d).
      effect: { kind: "search-library", filter: {}, destination: "graveyard", min: 1, max: 1 },
      resolve: null,
      text: TEXT,
    },
  ],
});
