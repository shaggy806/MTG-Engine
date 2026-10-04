import { defineCard } from "../define.js";

// EDHREC rank 6381.
// Intervening "if" (the 2009-10-01 ruling): `condition` is checked as the
// trigger would fire and again on resolution (Dragonmaster Outcast's shape).

const TEXT =
  "At the beginning of your upkeep, if you control five or more lands, put four +1/+1 counters on this creature.";

export default defineCard({
  name: "Scute Mob",
  manaCost: "{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Insect"],
  power: 1,
  toughness: 1,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      condition: { kind: "controls", filter: { type: "land" }, atLeast: 5 },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 4 },
      resolve: null,
      text: TEXT,
    },
  ],
});
