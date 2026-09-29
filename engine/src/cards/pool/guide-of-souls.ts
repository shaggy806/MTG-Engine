import { defineCard } from "../define.js";

const ENTER_TEXT = "Whenever another creature you control enters, you gain 1 life and get {E} (an energy counter).";
const ATTACK_TEXT =
  "Whenever you attack, you may pay {E}{E}{E}. When you do, put two +1/+1 counters and a flying " +
  "counter on target attacking creature. It becomes an Angel in addition to its other types.";
const WHEN_YOU_DO =
  "When you do, put two +1/+1 counters and a flying counter on target attacking creature. It " +
  "becomes an Angel in addition to its other types.";

// The Angel type has no duration: it lasts as long as the creature stays.
export default defineCard({
  name: "Guide of Souls",
  manaCost: "{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Cleric"],
  power: 1,
  toughness: 2,
  text: `${ENTER_TEXT}\n${ATTACK_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", otherOnly: true, filter: { type: "creature" } },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "gain-life", amount: 1 },
          { kind: "get-energy", amount: 1 },
        ],
      },
      resolve: null,
      text: ENTER_TEXT,
    },
    {
      trigger: { on: "attack-with", who: "you", atLeast: 1 },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Pay {E}{E}{E} to make an attacking creature an Angel?",
        costEnergy: 3,
        effect: {
          kind: "reflexive-trigger",
          targets: [{ kind: "permanent", filter: { type: "creature", attacking: true } }],
          effect: {
            kind: "sequence",
            effects: [
              { kind: "add-counter", target: 0, counter: "+1/+1", amount: 2 },
              { kind: "add-counter", target: 0, counter: "flying", amount: 1 },
              { kind: "add-types", target: 0, addSubtypes: ["Angel"], duration: "permanent" },
            ],
          },
          text: WHEN_YOU_DO,
        },
      },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
});
