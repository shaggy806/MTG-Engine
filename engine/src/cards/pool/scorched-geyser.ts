import { defineCard } from "../define.js";
import { enterTappedUnlessLands, manaTapAbility } from "../helpers.js";

// EDHREC rank 2521. Cinder Glade's shape.
//
// Rulings:
//   [2026-03-20] If this land enters the battlefield at the same time as any number of basic
//     lands, those other lands are not counted when determining if this land enters the
//     battlefield tapped or untapped.

export default defineCard({
  name: "Scorched Geyser",
  colors: [],
  types: ["land"],
  subtypes: ["Island", "Mountain"],
  text: "({T}: Add {U} or {R}.)\nThis land enters tapped unless you control two or more basic lands.",
  static: [enterTappedUnlessLands("Scorched Geyser", 2, "basic")],
  activated: [manaTapAbility("U"), manaTapAbility("R")],
});
