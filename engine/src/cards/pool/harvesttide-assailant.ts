import { defineCard } from "../define.js";

/** The nightbound back face of Harvesttide Infiltrator. */
export default defineCard({
  name: "Harvesttide Assailant",
  // A back face has no Scryfall card of its own name — point at its art.
  art: "https://cards.scryfall.io/art_crop/back/3/5/35fdb976-291c-4824-9518-dd8c9f93fcde.jpg",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Werewolf"],
  power: 4,
  toughness: 4,
  keywords: ["trample", "nightbound"],
  text: "Trample\nNightbound (If a player casts at least two spells during their own turn, it becomes day next turn.)",
  faces: ["Harvesttide Infiltrator", "Harvesttide Assailant"],
  transform: true,
});
