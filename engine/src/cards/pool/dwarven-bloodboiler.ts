import { defineCard } from "../define.js";

export default defineCard({
  name: "Dwarven Bloodboiler",
  manaCost: "{R}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Dwarf"],
  power: 2,
  toughness: 2,
  text: "Tap an untapped Dwarf you control: Target creature gets +2/+0 until end of turn.",
  activated: [
    {
      cost: {
        mana: null,
        tap: false,
        tapOthers: { count: 1, filter: { subtype: "Dwarf", controlledBy: "you" }, includeSelf: true },
      },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: 2, toughness: 0, duration: "end-of-turn" },
      resolve: null,
      text: "Tap an untapped Dwarf you control: Target creature gets +2/+0 until end of turn.",
    },
  ],
});
