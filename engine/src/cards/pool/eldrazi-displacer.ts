import { defineCard } from "../define.js";

// EDHREC rank 3039.
//
// Rulings:
//   [2016-01-22] If a creature token is exiled this way, it will cease to exist and will not
//     return to the battlefield.
//   [2016-01-22] After the creature returns to the battlefield, it will be a new object with no
//     connection to the creature that was exiled. It won't be in combat or have any additional
//     abilities it may have had when it was exiled. Any +1/+1 counters on it or Auras attached to
//     it are removed, and any Equipment will no longer be attached.
//
// Devoid: colourless for its white mana cost (Basking Broodscale). `flicker` returns under the
// owner's control; `tapped` is Nezahal's "return it to the battlefield tapped".
const TEXT =
  "{2}{C}: Exile another target creature, then return it to the battlefield tapped under its owner's control.";

export default defineCard({
  name: "Eldrazi Displacer",
  manaCost: "{2}{W}",
  colors: [],
  types: ["creature"],
  subtypes: ["Eldrazi"],
  power: 3,
  toughness: 3,
  text: `Devoid (This card has no color.)\n${TEXT} ({C} represents colorless mana.)`,
  activated: [
    {
      cost: { mana: "{2}{C}", tap: false },
      targets: [{ kind: "other", of: "creature" }],
      effect: { kind: "flicker", target: 0, tapped: true },
      resolve: null,
      text: TEXT,
    },
  ],
});
