import { defineCard } from "../define.js";

// EDHREC rank 4899.
//
// Rulings:
//   [2019-07-12] It doesn't matter whether a player has 4 or less life than they started the turn
//     with. If a player lost 4 life but also gained 6 life, that player still lost 4 life.
//   [2019-07-12] Knight of the Ebon Legion looks at your entire turn to determine whether a player
//     lost 4 or more life. It doesn't matter how many players lost 4 or more life, only whether
//     anyone did. It also doesn't matter whether Knight of the Ebon Legion was on the battlefield
//     when they lost life.
//   [2019-07-12] A player loses life if they pay life.
//   [2019-07-12] A player doesn't need to have lost 4 life all at once. If a player loses 2 life
//     twice during a turn, that player lost 4 life during that turn, and Knight of the Ebon Legion
//     receives a +1/+1 counter.
//
// The intervening-if is Y'shtola, Night's Blessed's: the `life-lost` turn stat, per player
// (never summed across players), any player including you.

const PUMP_TEXT = "{2}{B}: This creature gets +3/+3 and gains deathtouch until end of turn.";
const END_TEXT =
  "At the beginning of your end step, if a player lost 4 or more life this turn, put a +1/+1 counter on this creature. (Damage causes loss of life.)";

export default defineCard({
  name: "Knight of the Ebon Legion",
  manaCost: "{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Vampire", "Knight"],
  power: 1,
  toughness: 2,
  text: `${PUMP_TEXT}\n${END_TEXT}`,
  activated: [
    {
      cost: { mana: "{2}{B}", tap: false },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "modify-pt", target: "source", power: 3, toughness: 3, duration: "end-of-turn" },
          { kind: "grant-keyword", target: "source", keyword: "deathtouch", duration: "end-of-turn" },
        ],
      },
      resolve: null,
      text: PUMP_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      condition: { kind: "turn-stat", stat: "life-lost", who: "any-player", atLeast: 4 },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: END_TEXT,
    },
  ],
});
