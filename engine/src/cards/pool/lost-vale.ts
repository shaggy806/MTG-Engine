import { addManaAbility } from "../helpers.js";
import { defineCard } from "../define.js";

// The back face of Dowsing Dagger.
export default defineCard({
  name: "Lost Vale",
  art: "https://cards.scryfall.io/art_crop/back/5/1/514d53be-6ade-4f73-a844-e9ae2dafd6ce.jpg",
  colors: [],
  types: ["land"],
  text: "(Transforms from Dowsing Dagger.)\n{T}: Add three mana of any one color.",
  activated: [addManaAbility({ mana: "any-color", amount: 3, text: "{T}: Add three mana of any one color." })],
  faces: ["Dowsing Dagger", "Lost Vale"],
  transform: true,
});
