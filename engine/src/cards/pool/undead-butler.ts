import { defineCard } from "../define.js";

// EDHREC rank 4333.

const DIES_TEXT =
  "When this creature dies, you may exile it. When you do, return target creature card from your graveyard to your hand.";

export default defineCard({
  name: "Undead Butler",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie"],
  power: 1,
  toughness: 2,
  text: `When this creature enters, mill three cards. (Put the top three cards of your library into your graveyard.)\n${DIES_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "mill", target: "you", amount: 3 },
      resolve: null,
      text: "When this creature enters, mill three cards.",
    },
    {
      // The Balrog of Moria's "you may exile it. When you do" shape: the
      // reflexive trigger targets only once the exile has happened, so the
      // Butler itself, exiled, can't be the card returned.
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Exile Undead Butler?",
        effect: {
          kind: "sequence",
          effects: [
            { kind: "exile", target: "trigger-object" },
            {
              kind: "conditional",
              condition: { kind: "this-way", what: "exiled" },
              then: {
                kind: "reflexive-trigger",
                targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "creature" } }],
                effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
                text: "When you do, return target creature card from your graveyard to your hand.",
              },
            },
          ],
        },
      },
      resolve: null,
      text: DIES_TEXT,
    },
  ],
});
