import { defineCard } from "../define.js";

export default defineCard({
  name: "Hollow Scavenger",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Wolf"],
  power: 3,
  toughness: 2,
  text: "{1}, Sacrifice a Food: This creature gets +2/+2 until end of turn. Activate only once each turn.",
  activated: [
    {
      cost: { mana: "{1}", tap: false, sacrifice: { filter: { subtype: "Food" } } },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 2, toughness: 2, duration: "end-of-turn" },
      resolve: null,
      text: "{1}, Sacrifice a Food: This creature gets +2/+2 until end of turn. Activate only once each turn.",
      oncePerTurn: true,
    },
  ],
  faces: ["Hollow Scavenger", "Bakery Raid"],
  adventure: true,
});
