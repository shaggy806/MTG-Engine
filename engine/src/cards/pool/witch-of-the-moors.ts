import { defineCard } from "../define.js";

// EDHREC rank 2568.
//
// Rulings:
//   [2020-06-23] The triggered ability looks at whether you've gained life in the turn, even if
//     Witch of the Moors wasn't on the battlefield when you gained life. It doesn't care if you
//     also lost life, even if you lost more life than you gained.
//   [2020-06-23] You don't have to choose a target creature card at all. If you do and the target
//     card is an illegal target by the time the ability tries to resolve, the ability won't
//     resolve. Your opponents won't sacrifice creatures.
//   [2020-06-23] As the triggered ability resolves, first the next opponent in turn order chooses
//     a creature they control, then each other opponent in turn order does the same knowing the
//     choices made before them. Then all the chosen creatures are sacrificed at the same time.
//   [2020-06-23] If you haven't gained life by the time your end step begins, the triggered
//     ability won't trigger at all.
//   [2020-06-23] The triggered ability triggers just once, no matter how much life you've gained.

const TEXT =
  "At the beginning of your end step, if you gained life this turn, each opponent sacrifices a creature of their choice and you return up to one target creature card from your graveyard to your hand.";

export default defineCard({
  name: "Witch of the Moors",
  manaCost: "{3}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Human", "Warlock"],
  power: 4,
  toughness: 4,
  keywords: ["deathtouch"],
  text: `Deathtouch\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      condition: { kind: "turn-stat", stat: "life-gained", who: "you", atLeast: 1 },
      targets: [{ kind: "optional", of: { kind: "card-in-graveyard", whose: "you", filter: { type: "creature" } } }],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "sacrifice", who: "each-opponent", filter: { type: "creature" }, count: 1 },
          { kind: "return-to-hand", target: 0, from: "graveyard" },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
