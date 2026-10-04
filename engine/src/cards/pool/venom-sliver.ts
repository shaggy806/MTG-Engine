import { defineCard } from "../define.js";

// EDHREC rank 4368.
//
// Rulings:
//   [2014-07-18] If you change the creature type of a Sliver you control so it’s no longer a
//     Sliver, it will no longer be affected by its own ability.
//   [2014-07-18] Slivers in this set affect only Sliver creatures you control.

const TEXT = "Sliver creatures you control have deathtouch.";

export default defineCard({
  name: "Venom Sliver",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Sliver"],
  power: 1,
  toughness: 1,
  text: `${TEXT} (Any amount of damage a creature with deathtouch deals to a creature is enough to destroy it.)`,
  static: [
    {
      affects: { scope: "filter", filter: { type: "creature", subtype: "Sliver", controlledBy: "you" } },
      grantKeywords: ["deathtouch"],
      text: TEXT,
    },
  ],
});
