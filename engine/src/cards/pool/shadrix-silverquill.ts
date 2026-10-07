import { defineCard } from "../define.js";

const TRIGGER_TEXT =
  "At the beginning of combat on your turn, you may choose two. Each mode must target a different player.";
const TOKEN_MODE = "Target player creates a 2/1 white and black Inkling creature token with flying.";
const DRAW_MODE = "Target player draws a card and loses 1 life.";
const COUNTER_MODE = "Target player puts a +1/+1 counter on each creature they control.";

// Exactly zero modes or two, never one; the modes and their target players
// are chosen as the ability goes on the stack (the ruling). The third mode's
// target player puts the counters, and may control no creatures.
export default defineCard({
  name: "Shadrix Silverquill",
  manaCost: "{3}{W}{B}",
  colors: ["W", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elder", "Dragon"],
  power: 2,
  toughness: 5,
  keywords: ["flying", "double-strike"],
  text: `Flying, double strike\n${TRIGGER_TEXT}\n• ${TOKEN_MODE}\n• ${DRAW_MODE}\n• ${COUNTER_MODE}`,
  triggered: [
    {
      trigger: { on: "step-begins", step: "begin-combat", who: "you" },
      targets: [],
      effect: {
        kind: "modal",
        announced: true,
        optional: true,
        eachTargetsDifferentPlayer: true,
        minModes: 2,
        maxModes: 2,
        modes: [
          {
            text: TOKEN_MODE,
            targets: ["player"],
            effect: { kind: "create-token", token: "Inkling Token", count: 1, who: "target-controller" },
          },
          {
            text: DRAW_MODE,
            targets: ["player"],
            effect: {
              kind: "sequence",
              effects: [
                { kind: "draw", amount: 1, target: 0 },
                { kind: "lose-life", amount: 1, target: 0 },
              ],
            },
          },
          {
            text: COUNTER_MODE,
            targets: ["player"],
            effect: {
              kind: "add-counter-all",
              filter: { type: "creature", controlledBy: "you" },
              counter: "+1/+1",
              amount: 1,
              controlledByTarget: 0,
              putByTarget: true,
            },
          },
        ],
      },
      resolve: null,
      text: `${TRIGGER_TEXT} ${TOKEN_MODE} ${DRAW_MODE} ${COUNTER_MODE}`,
    },
  ],
});
