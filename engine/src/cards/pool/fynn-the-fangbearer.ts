import { defineCard } from "../define.js";

// #126 in top-commanders.txt.
const TRIGGER_TEXT =
  "Whenever a creature you control with deathtouch deals combat damage to a player, that player " +
  "gets two poison counters. (A player with ten or more poison counters loses the game.)";

export default defineCard({
  name: "Fynn, the Fangbearer",
  manaCost: "{1}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Warrior"],
  power: 1,
  toughness: 3,
  keywords: ["deathtouch"],
  text: `Deathtouch\n${TRIGGER_TEXT}`,
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "you-control", filter: { keyword: "deathtouch" } },
      targets: [],
      effect: { kind: "add-player-counters", counter: "poison", amount: 2, who: "trigger-player" },
      resolve: null,
      text: TRIGGER_TEXT,
    },
  ],
});
