import { defineCard } from "../define.js";

// EDHREC rank 6580.
//
// Rulings:
//   [2011-06-01] If Fangren Marauder has itself become an artifact for some reason, you'll gain 5
//     life when it is put into a graveyard from the battlefield.

export default defineCard({
  name: "Fangren Marauder",
  manaCost: "{5}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Beast"],
  power: 5,
  toughness: 5,
  text: "Whenever an artifact is put into a graveyard from the battlefield, you may gain 5 life.",
  triggered: [
    {
      // "Put into a graveyard from the battlefield" is "dies" (rule 700.4) for any permanent
      // (Disciple of the Vault's shape).
      trigger: { on: "dies", who: "any", filter: { type: "artifact" } },
      targets: [],
      effect: { kind: "may", prompt: "Gain 5 life?", effect: { kind: "gain-life", amount: 5 } },
      resolve: null,
      text: "Whenever an artifact is put into a graveyard from the battlefield, you may gain 5 life.",
    },
  ],
});
