import { defineCard } from "../define.js";

const TEXT =
  "Whenever you cast a noncreature spell, create an X/X red Dragon Illusion creature token with flying and haste, where X is the amount of mana spent to cast that spell. Exile that token at the beginning of the next end step.";
const SPENT = { manaSpentOf: "trigger-object" } as const;

export default defineCard({
  name: "Manaform Hellkite",
  manaCost: "{2}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 4,
  toughness: 4,
  keywords: ["flying"],
  text: `Flying\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", noncreatureOnly: true },
      targets: [],
      effect: {
        kind: "create-token",
        token: "Dragon Illusion Token",
        count: 1,
        basePt: { power: SPENT, toughness: SPENT },
        exileAtEndStep: true,
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
