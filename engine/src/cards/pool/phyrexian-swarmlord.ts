import { defineCard } from "../define.js";

// "Each poison counter your opponents have" is every opponent's, summed, as
// the trigger resolves.
export default defineCard({
  name: "Phyrexian Swarmlord",
  manaCost: "{4}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Phyrexian", "Insect", "Horror"],
  power: 4,
  toughness: 4,
  keywords: ["infect"],
  text: "Infect (This creature deals damage to creatures in the form of -1/-1 counters and to players in the form of poison counters.)\nAt the beginning of your upkeep, create a 1/1 green Phyrexian Insect creature token with infect for each poison counter your opponents have.",
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: {
        kind: "create-token",
        token: "Phyrexian Insect Token",
        count: { playerCounters: "poison", who: "each-opponent" },
      },
      resolve: null,
      text: "At the beginning of your upkeep, create a 1/1 green Phyrexian Insect creature token with infect for each poison counter your opponents have.",
    },
  ],
});
