import { defineCard } from "../define.js";

const ENTER_TEXT = "When this creature enters, create a number of 1/1 black Rat creature tokens equal to the number of opponents you have.";
const SAC_TEXT = "{1}{B}, Sacrifice a creature: Target creature gets -2/-2 until end of turn.";

export default defineCard({
  name: "Chittering Witch",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Human", "Warlock"],
  power: 2,
  toughness: 2,
  text: `${ENTER_TEXT}\n${SAC_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Rat Token", count: { countPlayers: "each-opponent" } },
      resolve: null,
      text: ENTER_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{1}{B}", tap: false, sacrifice: "creature-you-control" },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: -2, toughness: -2, duration: "end-of-turn" },
      resolve: null,
      text: SAC_TEXT,
    },
  ],
});
