import { defineCard } from "../define.js";

// #56 in top-commanders.txt.
//
// The third ability works from the **command zone** (`fromCommandZone`), and
// its "if Oloro is in the command zone" is a real intervening-if (rule
// 603.4): it's checked as the upkeep begins and again on resolution, so
// casting Oloro in response loses the life. On the battlefield the same
// condition is false, so a battlefield Oloro gains 2 a turn, not 4. The first
// ability works only on the battlefield, which is the default.
//
// The second triggers once per life-gain event, however much is gained (its
// 2013-10-17 rulings): two lifelinkers dealing combat damage at once trigger
// it twice, one lifelinker hitting several things at once triggers it once
// (`Game.withDamageBatch`).
const UPKEEP_TEXT = "At the beginning of your upkeep, you gain 2 life.";
const DRAIN_TEXT =
  "Whenever you gain life, you may pay {1}. If you do, draw a card and each opponent loses " +
  "1 life.";
const COMMAND_ZONE_TEXT =
  "At the beginning of your upkeep, if Oloro is in the command zone, you gain 2 life.";

export default defineCard({
  name: "Oloro, Ageless Ascetic",
  manaCost: "{3}{W}{U}{B}",
  colors: ["W", "U", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Giant", "Soldier"],
  power: 4,
  toughness: 5,
  text: `${UPKEEP_TEXT}\n${DRAIN_TEXT}\n${COMMAND_ZONE_TEXT}`,
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: { kind: "gain-life", amount: 2 },
      resolve: null,
      text: UPKEEP_TEXT,
    },
    {
      trigger: { on: "gains-life", who: "you" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Pay {1} to draw a card and have each opponent lose 1 life?",
        cost: "{1}",
        effect: {
          kind: "sequence",
          effects: [
            { kind: "draw", amount: 1 },
            { kind: "lose-life", amount: 1, who: "each-opponent" },
          ],
        },
      },
      resolve: null,
      text: DRAIN_TEXT,
    },
    {
      fromCommandZone: true,
      condition: { kind: "source-zone", zones: ["command"], sameObject: true },
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: { kind: "gain-life", amount: 2 },
      resolve: null,
      text: COMMAND_ZONE_TEXT,
    },
  ],
});
