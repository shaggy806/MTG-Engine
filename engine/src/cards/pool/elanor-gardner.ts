import { defineCard } from "../define.js";

// EDHREC rank 3653.
// Makes Food → uses "Food Token".
//
// Rulings:
//   [2023-06-16] Elanor Gardner's last ability will trigger only once during your end step, no
//     matter how many Foods you sacrificed this turn. However, if you haven't sacrificed any Foods
//     this turn as your end step begins, the ability won't trigger at all. It's not possible to
//     sacrifice a Food during the end step in time to have the ability trigger.
//   [2023-06-16] Elanor Gardner doesn't need to have been on the battlefield when you sacrificed a
//     Food this turn. For example, if you sacrifice a Food during your first main phase and you
//     cast Elanor Gardner during your second main phase, its last ability will trigger at the
//     beginning of your end step.
//   [2024-11-08] If an effect refers to a Food, it means any Food artifact, not just a Food
//     artifact token.
//
// "If you sacrificed a Food this turn" is the intervening-if `turn-history`
// condition (the player's own sacrificed list, read as each one last existed
// — any Food artifact, token or not), asked as the end step begins and again
// on resolution. The search itself is optional (Rampart Architect's shape).
const ENTER_TEXT = "When Elanor enters, create a Food token.";
const END_TEXT =
  "At the beginning of your end step, if you sacrificed a Food this turn, you may search your library for a basic land card, put that card onto the battlefield tapped, then shuffle.";

export default defineCard({
  name: "Elanor Gardner",
  manaCost: "{3}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Halfling", "Scout"],
  power: 2,
  toughness: 4,
  text: `${ENTER_TEXT}\n${END_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Food Token", count: 1 },
      resolve: null,
      text: ENTER_TEXT,
    },
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      condition: { kind: "turn-history", what: "sacrificed", who: "you", filter: { subtype: "Food" } },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Search for a basic land card?",
        effect: {
          kind: "search-library",
          filter: { type: "land", supertype: "basic" },
          destination: "battlefield",
          enterTapped: true,
          min: 0,
          max: 1,
        },
      },
      resolve: null,
      text: END_TEXT,
    },
  ],
});
