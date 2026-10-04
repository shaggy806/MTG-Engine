import { defineCard } from "../define.js";

// EDHREC rank 4051.
//
// Rulings:
//   [2014-07-18] The choice of creature type is made as Obelisk of Urd enters the battlefield.
//     Players can't respond to this choice. The bonus starts applying immediately.
//   [2014-07-18] You must choose an existing creature type.
//   [2024-01-12] When calculating a spell's total cost, include any alternative costs, additional
//     costs, or anything else that increases or reduces the cost to cast the spell. Convoke
//     applies after the total cost is calculated. Convoke doesn't change a spell's mana cost or
//     mana value.
//   [2024-01-12] Because convoke isn't an alternative cost, it can be used in conjunction with
//     alternative costs.
//   [2024-01-12] If a creature you control has a mana ability with {T} in the cost, activating
//     that ability while casting a spell with convoke will result in the creature being tapped
//     before you pay the spell's costs. You won't be able to tap it again for convoke. Similarly,
//     if you sacrifice a creature to activate a mana ability while casting a spell with convoke,
//     that creature won't be on the battlefield when you pay the spell's costs, so you won't be
//     able to tap it for convoke.
//   [2024-01-12] Tapping a multicolored creature using convoke will pay for {1} or one mana of
//     your choice of any of that creature's colors.
//   [2024-01-12] You can tap any untapped creature you control to convoke a spell, even one you
//     haven't controlled continuously since the beginning of your most recent turn.
//   [2024-01-12] Tapping an untapped creature that's attacking or blocking to convoke a spell
//     won't cause that creature to stop attacking or blocking.

export default defineCard({
  name: "Obelisk of Urd",
  manaCost: "{6}",
  colors: [],
  types: ["artifact"],
  text: "Convoke (Your creatures can help cast this spell. Each creature you tap while casting this spell pays for {1} or one mana of that creature's color.)\nAs this artifact enters, choose a creature type.\nCreatures you control of the chosen type get +2/+2.",
  convoke: true,
  chooseCreatureTypeOnEnter: true,
  static: [
    {
      affects: { scope: "filter", filter: { type: "creature", controlledBy: "you", ofChosenType: true } },
      grantPt: [2, 2],
      text: "Creatures you control of the chosen type get +2/+2.",
    },
  ],
});
