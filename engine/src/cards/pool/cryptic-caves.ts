import { defineCard } from "../define.js";

// EDHREC rank 4599.
//
// Rulings:
//   [2019-07-12] Cryptic Caves can be one of the five lands you control. You don't need to control
//     five other lands. It's okay that you'll only control four lands as you finish activating
//     Cryptic Caves's last ability.
//   [2019-07-12] If you control two Cryptic Caves and exactly three other lands, you can activate
//     the last ability of only one of the Cryptic Caves. As soon as the cost for that ability is
//     paid, you will no longer control enough lands to activate the ability of the second Cryptic
//     Caves.

export default defineCard({
  name: "Cryptic Caves",
  colors: [],
  types: ["land"],
  text: "{T}: Add {C}.\n{1}, {T}, Sacrifice this land: Draw a card. Activate only if you control five or more lands.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: "{1}", tap: true, sacrifice: "self" },
      // Temple of the False God's restriction (the Caves count among the five).
      condition: { kind: "controls", filter: { type: "land" }, atLeast: 5 },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{1}, {T}, Sacrifice this land: Draw a card. Activate only if you control five or more lands.",
    },
  ],
});
