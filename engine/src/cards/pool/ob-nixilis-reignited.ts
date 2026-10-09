import { defineCard } from "../define.js";

// Chaos Incarnate.
//
// The −8's emblem is owned and controlled by the target opponent (its
// ruling, rule 114.2), so its "you" is them: every card any player draws
// costs them 2 life, and it stays if Ob Nixilis's controller leaves the
// game. An emblem's triggered ability works from the command zone (rule
// 114.4) — `create-emblem`'s `triggered`, given to target slot 0 (`to`).
const PLUS = "+1: You draw a card and you lose 1 life.";
const MINUS = "−3: Destroy target creature.";
const EMBLEM = "Whenever a player draws a card, you lose 2 life.";
const ULTIMATE = `−8: Target opponent gets an emblem with "${EMBLEM}"`;

export default defineCard({
  name: "Ob Nixilis Reignited",
  manaCost: "{3}{B}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["planeswalker"],
  subtypes: ["Nixilis"],
  loyalty: 5,
  text: `${PLUS}\n${MINUS}\n${ULTIMATE}`,
  activated: [
    {
      loyaltyCost: 1,
      cost: { mana: null, tap: false },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "draw", amount: 1 },
          { kind: "lose-life", amount: 1 },
        ],
      },
      resolve: null,
      text: PLUS,
    },
    {
      loyaltyCost: -3,
      cost: { mana: null, tap: false },
      targets: ["creature"],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: MINUS,
    },
    {
      loyaltyCost: -8,
      cost: { mana: null, tap: false },
      targets: ["opponent"],
      effect: {
        kind: "create-emblem",
        text: EMBLEM,
        to: 0,
        triggered: [
          {
            trigger: { on: "draws", who: "any" },
            targets: [],
            effect: { kind: "lose-life", amount: 2 },
            resolve: null,
            text: EMBLEM,
          },
        ],
      },
      resolve: null,
      text: ULTIMATE,
    },
  ],
});
