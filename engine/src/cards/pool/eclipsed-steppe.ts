import { defineCard } from "../define.js";
import { enterTappedUnlessLands, manaTapAbility } from "../helpers.js";

// EDHREC rank 3685.
//
// Rulings:
//   [2026-03-20] If this land enters the battlefield at the same time as any number of basic
//     lands, those other lands are not counted when determining if this land enters the
//     battlefield tapped or untapped.
//   [2026-03-20] Unlike some other dual lands, Eclipsed Steppe has two basic land types. It's not
//     basic, so effects that search for basic lands can't find it.
//
// Canopy Vista's shape: the battle lands' "enters tapped unless you control
// two or more basic lands", with a Plains Swamp's two mana abilities.
export default defineCard({
  name: "Eclipsed Steppe",
  colors: [],
  types: ["land"],
  subtypes: ["Plains", "Swamp"],
  text: "({T}: Add {W} or {B}.)\nThis land enters tapped unless you control two or more basic lands.",
  static: [enterTappedUnlessLands("This land", 2, "basic")],
  activated: [manaTapAbility("W"), manaTapAbility("B")],
});
