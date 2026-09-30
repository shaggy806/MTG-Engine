import { defineCard } from "../define.js";

const YOURS = { type: "creature", controlledBy: "you" } as const;

export default defineCard({
  name: "Tower Defense",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["instant"],
  text: "Creatures you control get +0/+5 and gain reach until end of turn.",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "modify-pt-all", filter: YOURS, power: 0, toughness: 5, duration: "end-of-turn" },
      { kind: "grant-keyword-all", filter: YOURS, keyword: "reach", duration: "end-of-turn" },
    ],
  },
});
