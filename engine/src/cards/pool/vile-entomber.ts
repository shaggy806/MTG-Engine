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
      effect: { kind: "search-library", filter: {}, destination: "graveyard", min: 0, max: 1 },
      resolve: null,
      text: TEXT,
    },
  ],
});
