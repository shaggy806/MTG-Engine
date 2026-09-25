import { defineCard } from "../define.js";

export default defineCard({
  name: "Munda's Vanguard",
  manaCost: "{4}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Kor", "Knight", "Ally"],
  power: 3,
  toughness: 3,
  text: "Cohort — {T}, Tap an untapped Ally you control: Put a +1/+1 counter on each creature you control.",
  activated: [
    {
      cost: {
        mana: null,
        tap: true,
        tapOthers: { count: 1, filter: { subtype: "Ally", controlledBy: "you" } },
      },
      targets: [],
      effect: {
        kind: "add-counter-all",
        filter: { type: "creature", controlledBy: "you" },
        counter: "+1/+1",
        amount: 1,
      },
      resolve: null,
      text: "Cohort — {T}, Tap an untapped Ally you control: Put a +1/+1 counter on each creature you control.",
    },
  ],
});
