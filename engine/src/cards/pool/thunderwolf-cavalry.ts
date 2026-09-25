import { defineCard } from "../define.js";

export default defineCard({
  name: "Thunderwolf Cavalry",
  manaCost: "{4}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Astartes", "Warrior"],
  power: 4,
  toughness: 4,
  keywords: ["first-strike"],
  text: "First strike\nCrushing Teeth — Whenever this creature deals combat damage to a player, put a +1/+1 counter on each other creature you control.",
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [],
      effect: {
        kind: "add-counter-all",
        filter: { type: "creature", controlledBy: "you" },
        counter: "+1/+1",
        amount: 1,
        exceptSource: true,
      },
      resolve: null,
      text: "Crushing Teeth — Whenever this creature deals combat damage to a player, put a +1/+1 counter on each other creature you control.",
    },
  ],
});
