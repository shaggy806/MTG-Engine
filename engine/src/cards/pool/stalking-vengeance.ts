import { defineCard } from "../define.js";

// EDHREC rank 5300.

const TEXT =
  "Whenever another creature you control dies, it deals damage equal to its power to target player or planeswalker.";

// "It" is the creature that died: it deals the damage (`from`), and its power
// is the power it died with — both read by last-known information (rule
// 608.2h), as Rakdos Joins Up and Mask of Griselbrand read it.
export default defineCard({
  name: "Stalking Vengeance",
  manaCost: "{5}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Avatar"],
  power: 5,
  toughness: 5,
  keywords: ["haste"],
  text: `Haste\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "dies", who: "you-control", filter: { type: "creature" }, otherOnly: true },
      targets: ["player-or-planeswalker"],
      effect: { kind: "damage", target: 0, amount: { powerOf: "trigger-object" }, from: "trigger-object" },
      resolve: null,
      text: TEXT,
    },
  ],
});
