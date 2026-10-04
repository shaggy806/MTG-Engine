import { defineCard } from "../define.js";

// EDHREC rank 2475.
//
// Rulings:
//   [2020-08-07] If an artifact is put into a graveyard at the same time as Disciple of the Vault,
//     its ability triggers for that artifact.

export default defineCard({
  name: "Disciple of the Vault",
  manaCost: "{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Human", "Cleric"],
  power: 1,
  toughness: 1,
  text: "Whenever an artifact is put into a graveyard from the battlefield, you may have target opponent lose 1 life.",
  triggered: [
    {
      // "Put into a graveyard from the battlefield" is "dies" (rule 700.4) for any permanent.
      trigger: { on: "dies", who: "any", filter: { type: "artifact" } },
      targets: ["opponent"],
      effect: {
        kind: "may",
        prompt: "Have target opponent lose 1 life?",
        effect: { kind: "lose-life", amount: 1, target: 0 },
      },
      resolve: null,
      text: "Whenever an artifact is put into a graveyard from the battlefield, you may have target opponent lose 1 life.",
    },
  ],
});
