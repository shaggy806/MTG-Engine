import { defineCard } from "../define.js";

export default defineCard({
  name: "Aven Gagglemaster",
  manaCost: "{3}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Bird", "Warrior"],
  power: 4,
  toughness: 3,
  keywords: ["flying"],
  text:
    "Flying\n" +
    "When Aven Gagglemaster enters, you gain 2 life for each creature you control " +
    "with flying.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "gain-life",
        // It counts itself — it's on the battlefield by the time this resolves.
        amount: {
          countOf: { type: "creature", controlledBy: "you", keyword: "flying" },
          times: 2,
        },
      },
      resolve: null,
      text:
        "When Aven Gagglemaster enters, you gain 2 life for each creature you control " +
        "with flying.",
    },
  ],
});
