import { defineCard } from "../define.js";
import { dethrone } from "../helpers.js";

export default defineCard({
  name: "Treasonous Ogre",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Ogre", "Shaman"],
  power: 2,
  toughness: 3,
  text:
    "Dethrone (Whenever this creature attacks the player with the most life or tied for most life, put a +1/+1 counter on it.)\n" +
    "Pay 3 life: Add {R}.",
  triggered: [dethrone()],
  activated: [
    {
      cost: { mana: null, tap: false, payLife: 3 },
      targets: [],
      effect: { kind: "add-mana", mana: "R", amount: 1 },
      resolve: null,
      text: "Pay 3 life: Add {R}.",
    },
  ],
});
