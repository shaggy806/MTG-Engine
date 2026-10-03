import { defineCard } from "../define.js";

// "Double this creature's power" is +X/+0 where X is its power as the ability
// resolves (rule 701.10b; below 0 it gets -X/-0, 701.10c — `doubling`).
const ALLIANCE_TEXT =
  "Alliance — Whenever another creature you control enters, double this creature's power until end of turn.";

export default defineCard({
  name: "Devilish Valet",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Devil", "Warrior"],
  power: 1,
  toughness: 3,
  keywords: ["trample", "haste"],
  text: `Trample, haste\n${ALLIANCE_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "creature" }, otherOnly: true },
      targets: [],
      effect: {
        kind: "modify-pt",
        target: "source",
        power: { powerOf: "source", doubling: true },
        toughness: 0,
        duration: "end-of-turn",
      },
      resolve: null,
      text: ALLIANCE_TEXT,
    },
  ],
});
