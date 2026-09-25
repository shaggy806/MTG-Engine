import { defineCard } from "../define.js";

export default defineCard({
  name: "Katara, Heroic Healer",
  manaCost: "{4}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Warrior", "Ally"],
  power: 2,
  toughness: 3,
  keywords: ["lifelink"],
  text: "Lifelink (Damage dealt by this creature also causes you to gain that much life.)\nWhen Katara enters, put a +1/+1 counter on each other creature you control.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "add-counter-all",
        filter: { type: "creature", controlledBy: "you" },
        counter: "+1/+1",
        amount: 1,
        exceptSource: true,
      },
      resolve: null,
      text: "When Katara enters, put a +1/+1 counter on each other creature you control.",
    },
  ],
});
