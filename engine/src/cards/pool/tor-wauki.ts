import { defineCard } from "../define.js";

export default defineCard({
  name: "Tor Wauki",
  manaCost: "{2}{B}{B}{R}",
  colors: ["B", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Archer"],
  power: 3,
  toughness: 3,
  text: "{T}: Tor Wauki deals 2 damage to target attacking or blocking creature.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: ["attacking-or-blocking-creature"],
      effect: { kind: "damage", amount: 2, target: 0 },
      resolve: null,
      text: "{T}: Tor Wauki deals 2 damage to target attacking or blocking creature.",
    },
  ],
});
