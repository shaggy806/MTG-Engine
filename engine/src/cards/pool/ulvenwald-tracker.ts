import { defineCard } from "../define.js";

// EDHREC rank 2970.
//
// Rulings:
//   [2017-03-14] The second target of Ulvenwald Tracker's ability can be another creature you
//     control, but it can't be the same creature as the first target.
//   [2017-03-14] If either target of Ulvenwald Tracker's ability is an illegal target when the
//     ability tries to resolve, neither creature will deal or be dealt damage.

const FIGHT_TEXT = "{1}{G}, {T}: Target creature you control fights another target creature.";

export default defineCard({
  name: "Ulvenwald Tracker",
  manaCost: "{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Human", "Shaman"],
  power: 1,
  toughness: 1,
  text: FIGHT_TEXT,
  activated: [
    {
      cost: { mana: "{1}{G}", tap: true },
      targets: ["creature-you-control", { kind: "other", of: "creature", than: { slot: 0 } }],
      effect: { kind: "fight", a: 0, b: 1 },
      resolve: null,
      text: FIGHT_TEXT,
    },
  ],
});
