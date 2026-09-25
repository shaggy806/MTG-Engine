import { defineCard } from "../define.js";

export default defineCard({
  name: "Catapult Squad",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 2,
  toughness: 1,
  text: "Tap two untapped Soldiers you control: This creature deals 2 damage to target attacking or blocking creature.",
  activated: [
    {
      cost: {
        mana: null,
        tap: false,
        tapOthers: { count: 2, filter: { subtype: "Soldier", controlledBy: "you" }, includeSelf: true },
      },
      targets: ["attacking-or-blocking-creature"],
      effect: { kind: "damage", amount: 2, target: 0 },
      resolve: null,
      text: "Tap two untapped Soldiers you control: This creature deals 2 damage to target attacking or blocking creature.",
    },
  ],
});
