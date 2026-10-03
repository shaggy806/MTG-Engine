import { defineCard } from "../define.js";

// The first and second resolutions this turn make a Treasure; from the third
// on, a {X} payment instead, and paying it triggers a reflexive ability
// (rule 603.12) whose target is chosen only then.
const ALLIANCE_TEXT =
  "Alliance — Whenever another creature you control enters, create a Treasure token if this is the first or second time this ability has resolved this turn. Otherwise, you may pay {X}. When you do, this creature deals X damage to any target.";
const TREASURE = { kind: "create-token", token: "Treasure Token", count: 1 } as const;

export default defineCard({
  name: "Rose Room Treasurer",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Ogre", "Warrior"],
  power: 4,
  toughness: 3,
  text: ALLIANCE_TEXT,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "creature" }, otherOnly: true },
      targets: [],
      effect: {
        kind: "conditional",
        condition: { kind: "resolved-this-turn", n: 1 },
        then: TREASURE,
        else: {
          kind: "conditional",
          condition: { kind: "resolved-this-turn", n: 2 },
          then: TREASURE,
          else: {
            kind: "may",
            prompt: "Pay {X} to have Rose Room Treasurer deal X damage to any target?",
            cost: "{X}",
            effect: {
              kind: "reflexive-trigger",
              targets: ["any-target"],
              effect: { kind: "damage", amount: "x", target: 0 },
              text: "When you do, this creature deals X damage to any target.",
            },
          },
        },
      },
      resolve: null,
      text: ALLIANCE_TEXT,
    },
  ],
});
