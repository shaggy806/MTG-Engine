import { defineCard } from "../define.js";

// EDHREC rank 2595.
//
// Rulings:
//   [2011-06-01] Unlike the equip ability, Brass Squire's ability can be activated whenever you
//     could cast an instant.
//   [2011-06-01] If one of the targets is illegal when the activated ability resolves, nothing
//     will happen and the Equipment won't move. Notably, if an opponent gains control of either
//     target in response, the Equipment won't move.

const TEXT = "{T}: Attach target Equipment you control to target creature you control.";

export default defineCard({
  name: "Brass Squire",
  manaCost: "{3}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Myr"],
  power: 1,
  toughness: 3,
  text: TEXT,
  activated: [
    {
      // Codsworth, Handy Helper's attach, at instant speed.
      cost: { mana: null, tap: true },
      targets: [{ kind: "permanent", whose: "you", filter: { subtype: "Equipment" } }, "creature-you-control"],
      effect: { kind: "attach", target: 1, attachment: 0 },
      resolve: null,
      text: TEXT,
    },
  ],
});
