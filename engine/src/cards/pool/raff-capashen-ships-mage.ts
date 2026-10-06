import { defineCard } from "../define.js";

// EDHREC rank 6459.
//
// Rulings:
//   [2018-04-27] A card, spell, or permanent is historic if it has the legendary supertype, the
//     artifact card type, or the Saga subtype.
//
// Historic is Arbaaz Mir's `anyOf`. An artifact land is played, not cast, so
// it isn't affected (Shimmer Myr's ruling).
const FLASH_TEXT =
  "You may cast historic spells as though they had flash. (Artifacts, legendaries, and Sagas are historic.)";

export default defineCard({
  name: "Raff Capashen, Ship's Mage",
  manaCost: "{2}{W}{U}",
  colors: ["W", "U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 3,
  toughness: 3,
  keywords: ["flash", "flying"],
  text: `Flash\nFlying\n${FLASH_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      castAsThoughFlash: { anyOf: [{ type: "artifact" }, { supertype: "legendary" }, { subtype: "Saga" }] },
      text: FLASH_TEXT,
    },
  ],
});
