import { defineCard } from "../define.js";

const TREASURE = "Whenever one or more creatures you control deal combat damage to a player, create a Treasure token.";
const UPKEEP =
  "Treasure Hunter — At the beginning of your upkeep, if you control thirty or more artifacts, you win the game.";

// The Treasure trigger is batched: once per player dealt combat damage in one
// damage step, however many creatures dealt it — Knuckles's own double strike
// makes two steps. "Treasure Hunter" is an ability word (rule 207.2c); the
// upkeep ability is an intervening-if (rule 603.4).
export default defineCard({
  name: "Knuckles the Echidna",
  manaCost: "{2}{R}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Echidna", "Warrior"],
  power: 2,
  toughness: 4,
  keywords: ["double-strike", "trample", "haste"],
  text: `Double strike, trample, haste\n${TREASURE}\n${UPKEEP}`,
  triggered: [
    {
      trigger: { on: "deals-damage-batch", who: "you-control", filter: { type: "creature" }, combat: true },
      targets: [],
      effect: { kind: "create-token", token: "Treasure Token", count: 1 },
      resolve: null,
      text: TREASURE,
    },
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      condition: { kind: "controls", filter: { type: "artifact" }, atLeast: 30 },
      targets: [],
      effect: { kind: "win-game" },
      resolve: null,
      text: UPKEEP,
    },
  ],
});
