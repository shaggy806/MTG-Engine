import { defineCard } from "../define.js";

// Both amounts are read as the mode resolves, from this turn's running
// totals (`PlayerState.lifeLostThisTurn` / `lifeGainedThisTurn`). Feed's
// target is chosen with the mode, as the trigger goes on the stack
// (rule 603.3c).
const TRIGGER_TEXT = "At the beginning of your end step, choose one —";
const FEED_MODE = "Feed — Target opponent loses life equal to the amount of life they lost this turn.";
const FRIENDS_MODE = "Friends — You gain life equal to the amount of life you gained this turn.";

export default defineCard({
  name: "Astarion, the Decadent",
  manaCost: "{4}{W}{B}",
  colors: ["W", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Vampire", "Elf", "Rogue"],
  power: 4,
  toughness: 4,
  keywords: ["deathtouch", "lifelink"],
  text: `Deathtouch, lifelink\n${TRIGGER_TEXT}\n• ${FEED_MODE}\n• ${FRIENDS_MODE}`,
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      targets: [],
      effect: {
        kind: "modal",
        announced: true,
        minModes: 1,
        maxModes: 1,
        modes: [
          {
            text: FEED_MODE,
            targets: ["opponent"],
            effect: { kind: "lose-life", target: 0, amount: { turnStat: "life-lost", target: 0 } },
          },
          {
            text: FRIENDS_MODE,
            targets: [],
            effect: { kind: "gain-life", amount: { turnStat: "life-gained" } },
          },
        ],
      },
      resolve: null,
      text: `${TRIGGER_TEXT} ${FEED_MODE} ${FRIENDS_MODE}`,
    },
  ],
});
