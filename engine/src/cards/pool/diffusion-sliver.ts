import { defineCard } from "../define.js";

// EDHREC rank 4301.
//
// Rulings:
//   [2014-07-18] The granted ability applies to any spell (including Aura spells), activated
//     ability, or triggered ability that’s controlled by an opponent that targets a Sliver you
//     control.
//   [2014-07-18] If you change the creature type of a Sliver you control so it’s no longer a
//     Sliver, it will no longer be affected by its own ability. Its ability will continue to
//     affect other Sliver creatures you control.
//   [2014-07-18] Slivers in this set affect only Sliver creatures you control. They don’t grant
//     bonuses to your opponents’ Slivers. This is the same way Slivers from the Magic 2014 core
//     set worked, while Slivers in earlier sets granted bonuses to all Slivers.
//   [2014-07-18] Abilities that Slivers grant, as well as power/toughness boosts, are cumulative.
//     However, for some abilities, like indestructible and the ability granted by Belligerent
//     Sliver, having more than one instance of the ability doesn’t provide any additional benefit.

// Ward's own effect (rule 702.21a) on a becomes-target trigger watching every
// Sliver creature you control (Thunderbreak Regent's trigger): the trigger
// records the spell or ability that did the targeting, and its controller
// pays {2} or it's countered. "An opponent controls" is relative to this
// Sliver's controller. Diffusion Sliver is a Sliver, so it covers itself.
const TEXT =
  "Whenever a Sliver creature you control becomes the target of a spell or ability an opponent controls, counter that spell or ability unless its controller pays {2}.";

export default defineCard({
  name: "Diffusion Sliver",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Sliver"],
  power: 1,
  toughness: 1,
  text: TEXT,
  triggered: [
    {
      trigger: {
        on: "becomes-target",
        who: "you-control",
        filter: { type: "creature", subtype: "Sliver" },
        byOpponentOnly: true,
      },
      targets: [],
      effect: { kind: "ward", cost: { mana: "{2}" } },
      resolve: null,
      text: TEXT,
    },
  ],
});
