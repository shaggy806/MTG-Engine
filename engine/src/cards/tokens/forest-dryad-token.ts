import { defineCard } from "../define.js";
import { manaTapAbility } from "../helpers.js";

/**
 * Staff of Titania's token: a 1/1 green Forest Dryad land creature. Its
 * "{T}: Add {G}" is the Forest type's own (rule 305.6), and as a creature
 * it can't be tapped for it while summoning sick (rule 302.6).
 */
export default defineCard({
  name: "Forest Dryad Token",
  art: "74de70f2-93b6-4fc5-8c4d-464f880d3c54",
  colors: ["G"],
  types: ["land", "creature"],
  subtypes: ["Forest", "Dryad"],
  power: 1,
  toughness: 1,
  activated: [manaTapAbility("G")],
});
