import { defineCard } from "../define.js";
import { hideaway, playHideawayCard } from "../helpers.js";

// EDHREC rank 5028.
//
// Rulings:
//   [2025-06-06] Town is a land type with no special meaning. It doesn't grant the land any
//     intrinsic abilities. Other cards may care about which lands are Towns.

export default defineCard({
  name: "Clive's Hideaway",
  colors: [],
  types: ["land"],
  subtypes: ["Town"],
  text: "Hideaway 4 (When this land enters, look at the top four cards of your library, exile one face down, then put the rest on the bottom in a random order.)\n{T}: Add {C}.\n{2}, {T}: You may play the exiled card without paying its mana cost if you control four or more legendary creatures.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: "{2}", tap: true },
      targets: [],
      // Mosswort Bridge's shape: the "if" is checked as the ability resolves.
      effect: {
        kind: "conditional",
        condition: { kind: "controls", filter: { type: "creature", supertype: "legendary" }, atLeast: 4 },
        then: playHideawayCard(),
      },
      resolve: null,
      text: "{2}, {T}: You may play the exiled card without paying its mana cost if you control four or more legendary creatures.",
    },
  ],
  // Since the 2022 rules change hideaway doesn't make it enter tapped, and
  // this one prints no "enters tapped".
  triggered: [hideaway(4, "land")],
});
