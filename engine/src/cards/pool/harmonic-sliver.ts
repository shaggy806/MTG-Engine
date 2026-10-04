import { defineCard } from "../define.js";

// EDHREC rank 3904.
//
// Rulings:
//   [2013-07-01] Abilities that Slivers grant, as well as power/toughness boosts, are cumulative.
//     However, for some abilities, like flying, having more than one instance of the ability
//     doesn't provide any additional benefit.
//   [2013-07-01] If the creature type of a Sliver changes so it's no longer a Sliver, it will no
//     longer be affected by its own ability. Its ability will continue to affect other Sliver
//     creatures.
//   [2021-03-19] The controller of the Sliver that enters the battlefield controls the triggered
//     ability for that Sliver and chooses what to destroy, not necessarily the controller of
//     Harmonic Sliver.
//   [2021-03-19] The ability Harmonic Sliver grants itself triggers when it enters the
//     battlefield.

const GRANTED_TEXT = "When this permanent enters, destroy target artifact or enchantment.";
const TEXT = `All Slivers have "${GRANTED_TEXT}"`;

export default defineCard({
  name: "Harmonic Sliver",
  manaCost: "{1}{G}{W}",
  colors: ["W", "G"],
  types: ["creature"],
  subtypes: ["Sliver"],
  power: 1,
  toughness: 1,
  text: TEXT,
  static: [
    {
      // Every Sliver, whoever controls it — this one included while it's a
      // Sliver. The granted ability is the Sliver's own, so that Sliver's
      // controller controls the trigger and picks the target (the rulings).
      affects: { scope: "filter", filter: { subtype: "Sliver" } },
      grantsTriggered: [
        {
          trigger: { on: "enters-battlefield", who: "self" },
          targets: ["artifact-or-enchantment"],
          effect: { kind: "destroy", target: 0 },
          resolve: null,
          text: GRANTED_TEXT,
        },
      ],
      text: TEXT,
    },
  ],
});
