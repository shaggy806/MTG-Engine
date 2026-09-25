import { defineCard } from "../define.js";

export default defineCard({
  name: "Celestial Ancient",
  manaCost: "{3}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Elemental"],
  power: 3,
  toughness: 3,
  keywords: ["flying"],
  text: "Flying\nWhenever you cast an enchantment spell, put a +1/+1 counter on each creature you control.",
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { type: "enchantment" } },
      targets: [],
      effect: {
        kind: "add-counter-all",
        filter: { type: "creature", controlledBy: "you" },
        counter: "+1/+1",
        amount: 1,
      },
      resolve: null,
      text: "Whenever you cast an enchantment spell, put a +1/+1 counter on each creature you control.",
    },
  ],
});
