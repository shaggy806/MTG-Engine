import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

// EDHREC rank 3266.
//
// Rulings:
//   [2013-07-01] Abilities that Slivers grant, as well as power/toughness boosts, are cumulative.
//     However, for some abilities, like flying, having more than one instance of the ability
//     doesn’t provide any additional benefit.
//   [2013-07-01] If you change the creature type of a Sliver you control so it’s no longer a
//     Sliver, it will no longer be affected by its own ability. Its ability will continue to
//     affect other Sliver creatures you control.

const TEXT = 'Sliver creatures you control have "{T}: Add one mana of any color."';

export default defineCard({
  name: "Manaweft Sliver",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Sliver"],
  power: 1,
  toughness: 1,
  text: TEXT,
  static: [
    {
      // Gemhide Sliver's grant, narrowed to Sliver creatures you control —
      // this one included while it's a Sliver (the ruling).
      affects: { scope: "filter", filter: { type: "creature", subtype: "Sliver", controlledBy: "you" } },
      grantsActivated: [addManaAbility({ mana: "any-color", text: "{T}: Add one mana of any color." })],
      text: TEXT,
    },
  ],
});
