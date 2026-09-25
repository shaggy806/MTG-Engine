import { defineCard } from "../define.js";

export default defineCard({
  name: "Borborygmos",
  manaCost: "{3}{R}{R}{G}{G}",
  colors: ["R", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Cyclops"],
  power: 6,
  toughness: 7,
  keywords: ["trample"],
  text: "Trample\nWhenever Borborygmos deals combat damage to a player, put a +1/+1 counter on each creature you control.",
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [],
      effect: {
        kind: "add-counter-all",
        filter: { type: "creature", controlledBy: "you" },
        counter: "+1/+1",
        amount: 1,
      },
      resolve: null,
      text: "Whenever Borborygmos deals combat damage to a player, put a +1/+1 counter on each creature you control.",
    },
  ],
});
