import { defineCard } from "../define.js";

// EDHREC rank 4805.
//
// Rulings:
//   [2024-07-26] If a token is exiled this way, it will cease to exist and won't return to the
//     battlefield.
//   [2024-07-26] Once the exiled permanent returns, it's considered a new object with no relation
//     to the object that it was. Auras attached to the exiled permanent will be put into their
//     owners' graveyards. Equipment attached to the exiled permanent will become unattached and
//     remain on the battlefield. Any counters on the exiled permanent will cease to exist.

export default defineCard({
  name: "Lilysplash Mentor",
  manaCost: "{2}{G}{U}",
  colors: ["U", "G"],
  types: ["creature"],
  subtypes: ["Frog", "Druid"],
  power: 4,
  toughness: 4,
  keywords: ["reach"],
  text: "Reach\n{1}{G}{U}: Exile another target creature you control, then return it to the battlefield under its owner's control with a +1/+1 counter on it. Activate only as a sorcery.",
  activated: [
    {
      cost: { mana: "{1}{G}{U}", tap: false },
      targets: [{ kind: "other", of: "creature-you-control" }],
      // Planar Incision's shape: the counter is on it as it returns.
      effect: { kind: "flicker", target: 0, thenCounters: { kind: "+1/+1", amount: 1, entering: true } },
      resolve: null,
      text: "{1}{G}{U}: Exile another target creature you control, then return it to the battlefield under its owner's control with a +1/+1 counter on it. Activate only as a sorcery.",
      sorcerySpeed: true,
    },
  ],
});
