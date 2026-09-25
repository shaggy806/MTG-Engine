import { defineCard } from "../define.js";

export default defineCard({
  name: "Precinct Captain",
  manaCost: "{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 2,
  toughness: 2,
  keywords: ["first-strike"],
  text: "First strike\nWhenever this creature deals combat damage to a player, create a 1/1 white Soldier creature token.",
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Soldier Token", count: 1 },
      resolve: null,
      text: "Whenever this creature deals combat damage to a player, create a 1/1 white Soldier creature token.",
    },
  ],
});
