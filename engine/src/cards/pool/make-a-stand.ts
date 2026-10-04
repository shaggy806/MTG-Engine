import { defineCard } from "../define.js";

// EDHREC rank 3332.

const YOURS = { type: "creature", controlledBy: "you" } as const;

export default defineCard({
  name: "Make a Stand",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["instant"],
  text: "Creatures you control get +1/+0 and gain indestructible until end of turn. (Damage and effects that say \"destroy\" don't destroy them.)",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "modify-pt-all", filter: YOURS, power: 1, toughness: 0, duration: "end-of-turn" },
      { kind: "grant-keyword-all", filter: YOURS, keyword: "indestructible", duration: "end-of-turn" },
    ],
  },
});
