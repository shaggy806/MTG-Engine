import { defineCard } from "../define.js";

const CONTROLS_COMMANDER = {
  kind: "controls",
  filter: { isCommander: true, controlledBy: "you" },
  atLeast: 1,
} as const;

export default defineCard({
  name: "Thunderfoot Baloth",
  manaCost: "{4}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Beast"],
  power: 5,
  toughness: 5,
  keywords: ["trample"],
  text:
    "Trample\n" +
    "Lieutenant — As long as you control your commander, this creature gets +2/+2 and other creatures you control get +2/+2 and have trample.",
  static: [
    {
      affects: { scope: "self" },
      condition: CONTROLS_COMMANDER,
      grantPt: [2, 2],
      text: "Lieutenant — As long as you control your commander, this creature gets +2/+2.",
    },
    {
      // "*Other* creatures you control" — the Baloth's own +2/+2 comes from
      // the self-scoped static above, so this one excludes it.
      affects: { scope: "creatures-you-control", excludeSelf: true },
      condition: CONTROLS_COMMANDER,
      grantPt: [2, 2],
      grantKeywords: ["trample"],
      text: "Lieutenant — As long as you control your commander, other creatures you control get +2/+2 and have trample.",
    },
  ],
});
