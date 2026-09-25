import { defineCard } from "../define.js";

export default defineCard({
  name: "Catapult Master",
  manaCost: "{3}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 3,
  toughness: 3,
  text: "Tap five untapped Soldiers you control: Exile target creature.",
  activated: [
    {
      cost: {
        mana: null,
        tap: false,
        tapOthers: { count: 5, filter: { subtype: "Soldier", controlledBy: "you" }, includeSelf: true },
      },
      targets: ["creature"],
      effect: { kind: "exile", target: 0 },
      resolve: null,
      text: "Tap five untapped Soldiers you control: Exile target creature.",
    },
  ],
});
