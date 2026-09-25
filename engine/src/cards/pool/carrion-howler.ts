import { defineCard } from "../define.js";

export default defineCard({
  name: "Carrion Howler",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie", "Wolf"],
  power: 2,
  toughness: 2,
  text: "Pay 1 life: This creature gets +2/-1 until end of turn.",
  activated: [
    {
      cost: { mana: null, tap: false, payLife: 1 },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 2, toughness: -1, duration: "end-of-turn" },
      resolve: null,
      text: "Pay 1 life: This creature gets +2/-1 until end of turn.",
    },
  ],
});
