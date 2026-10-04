import { defineCard } from "../define.js";

// EDHREC rank 3847.
//
// Rulings:
//   [2014-07-18] Abilities that Slivers grant, as well as power/toughness boosts, are cumulative.
//     However, for some abilities, like indestructible and the ability granted by Belligerent
//     Sliver, having more than one instance of the ability doesn’t provide any additional benefit.
//   [2014-07-18] If you change the creature type of a Sliver you control so it’s no longer a
//     Sliver, it will no longer be affected by its own ability. Its ability will continue to
//     affect other Sliver creatures you control.
//   [2014-07-18] Slivers in this set affect only Sliver creatures you control. They don’t grant
//     bonuses to your opponents’ Slivers. This is the same way Slivers from the Magic 2014 core
//     set worked, while Slivers in earlier sets granted bonuses to all Slivers.
//   [2014-07-18] Damage dealt to a Sliver with indestructible is still marked on that creature. If
//     it has lethal damage marked on it and it loses indestructible (perhaps because Sliver
//     Hivelord leaves the battlefield), it will be destroyed.

export default defineCard({
  name: "Sliver Hivelord",
  manaCost: "{W}{U}{B}{R}{G}",
  colors: ["W", "U", "B", "R", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Sliver"],
  power: 5,
  toughness: 5,
  text: "Sliver creatures you control have indestructible. (Damage and effects that say \"destroy\" don't destroy them.)",
  static: [
    {
      // Itself included: it's a Sliver creature you control.
      affects: { scope: "creatures-you-control", subtype: "Sliver" },
      grantKeywords: ["indestructible"],
      text: "Sliver creatures you control have indestructible.",
    },
  ],
});
