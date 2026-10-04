import { defineCard } from "../define.js";
import { equip, livingWeapon } from "../helpers.js";

// EDHREC rank 5089.
//
// Rulings:
//   [2011-06-01] The value of X is calculated continuously as the number of creature cards in
//     graveyards changes.
//   [2011-06-01] If there are no creature cards in any graveyard when Bonehoard's living weapon
//     ability resolves, the Germ will be 0/0 and put into its owner's graveyard.
//   [2011-06-01] Although creature tokens go to the graveyard before ceasing to exist, they never
//     count as creature cards and won't increase the bonus granted by Bonehoard, however briefly.
//
// X is every graveyard's creature cards (Mortivore's count), tokens excluded
// (the ruling): a live layer-7c bonus.
const PUMP_TEXT = "Equipped creature gets +X/+X, where X is the number of creature cards in all graveyards.";

export default defineCard({
  name: "Bonehoard",
  manaCost: "{4}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text:
    "Living weapon (When this Equipment enters, create a 0/0 black Phyrexian Germ creature token, then attach this to it.)\n" +
    `${PUMP_TEXT}\nEquip {2}`,
  triggered: [livingWeapon()],
  static: [
    {
      affects: { scope: "attached" },
      grantPtPerCount: { inGraveyard: { type: "creature", token: false }, pt: [1, 1] },
      text: PUMP_TEXT,
    },
  ],
  activated: [equip("{2}")],
});
