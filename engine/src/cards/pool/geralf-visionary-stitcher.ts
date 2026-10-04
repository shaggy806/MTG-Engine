import { defineCard } from "../define.js";

// EDHREC rank 5414.
// Makes Zombie → new token "Zombie Token (Geralf, Visionary Stitcher)" (scaffolded).
//
// Rulings:
//   [2021-11-19] If another permanent enters the battlefield under your control as a copy of
//     Geralf, Visionary Stitcher, the legend rule requires you to put one of them in a graveyard
//     before you can take any actions. You can't sacrifice the copy to pay the cost of the
//     original Geralf's activated ability.

export default defineCard({
  name: "Geralf, Visionary Stitcher",
  manaCost: "{2}{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 1,
  toughness: 4,
  text: "Zombies you control have flying.\n{U}, {T}, Sacrifice another nontoken creature: Create an X/X blue Zombie creature token, where X is the sacrificed creature's toughness.",
  activated: [
    {
      cost: { mana: "{U}", tap: true, sacrifice: { filter: { token: false, type: "creature" } } },
      targets: [],
      effect: {
        kind: "create-token",
        token: "Zombie Token (Geralf, Visionary Stitcher)",
        count: 1,
        basePt: { power: { toughnessOf: "sacrificed" }, toughness: { toughnessOf: "sacrificed" } },
      },
      resolve: null,
      text: "{U}, {T}, Sacrifice another nontoken creature: Create an X/X blue Zombie creature token, where X is the sacrificed creature's toughness.",
      otherOnly: true,
    },
  ],
  static: [
    {
      affects: { scope: "creatures-you-control", subtype: "Zombie" },
      grantKeywords: ["flying"],
      text: "Zombies you control have flying.",
    },
  ],
});
