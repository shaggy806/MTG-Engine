import { defineCard } from "../define.js";

// EDHREC rank 5888.

const LIFE_TEXT = "Whenever a nonbasic land an opponent controls enters, you gain 1 life.";

export default defineCard({
  name: "Spectrum Sentinel",
  manaCost: "{1}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Soldier"],
  power: 1,
  toughness: 2,
  text: `Protection from multicolored (This creature can't be blocked, targeted, dealt damage, enchanted, or equipped by anything multicolored.)\n${LIFE_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      protection: { filter: { multicolored: true } },
      text: "Protection from multicolored",
    },
  ],
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "any",
        filter: { type: "land", notSupertype: "basic", controlledBy: "opponent" },
      },
      targets: [],
      effect: { kind: "gain-life", amount: 1 },
      resolve: null,
      text: LIFE_TEXT,
    },
  ],
});
