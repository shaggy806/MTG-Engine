import { defineCard } from "../define.js";

const GAIN_TEXT = "Whenever another creature you control enters, you may gain 1 life.";
const DRAIN_TEXT = "Whenever a creature an opponent controls enters, you may have that player lose 1 life.";

export default defineCard({
  name: "Suture Priest",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Phyrexian", "Cleric"],
  power: 1,
  toughness: 1,
  text: `${GAIN_TEXT}\n${DRAIN_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "creature" }, otherOnly: true },
      targets: [],
      effect: { kind: "may", prompt: "Gain 1 life?", effect: { kind: "gain-life", amount: 1 } },
      resolve: null,
      text: GAIN_TEXT,
    },
    {
      trigger: { on: "enters-battlefield", who: "opponent", filter: { type: "creature" } },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Have that player lose 1 life?",
        effect: { kind: "lose-life", amount: 1, who: "trigger-controller" },
      },
      resolve: null,
      text: DRAIN_TEXT,
    },
  ],
});
