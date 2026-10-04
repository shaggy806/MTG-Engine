import { defineCard } from "../define.js";

// EDHREC rank 4340.
//
// Rulings:
//   [2021-03-19] The life you gain is based on the total amount of life you lost, not the
//     difference in your life total from when the turn started. For example, if you lose 5 life
//     and gain 3 life before activating the ability, the ability will cause you to gain 5 life,
//     not 2.
//   [2021-03-19] If your life total becomes 0 or less, you'll lose the game before you can
//     activate the ability of Children of Korlis.

const TEXT = "Sacrifice this creature: You gain life equal to the life you've lost this turn.";

export default defineCard({
  name: "Children of Korlis",
  manaCost: "{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Rebel", "Cleric"],
  power: 1,
  toughness: 1,
  text: `${TEXT} (Damage causes loss of life.)`,
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: "self" },
      targets: [],
      // The turn's gross life lost (`lifeLostThisTurn`), not the net change —
      // the ruling.
      effect: { kind: "gain-life", amount: { turnStat: "life-lost", who: "you" } },
      resolve: null,
      text: TEXT,
    },
  ],
});
