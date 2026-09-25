import { defineCard } from "../define.js";

export default defineCard({
  name: "Aphetto Grifter",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 1,
  toughness: 1,
  text: "Tap two untapped Wizards you control: Tap target permanent.",
  activated: [
    {
      cost: {
        mana: null,
        tap: false,
        tapOthers: { count: 2, filter: { subtype: "Wizard", controlledBy: "you" }, includeSelf: true },
      },
      targets: ["permanent"],
      effect: { kind: "tap", target: 0 },
      resolve: null,
      text: "Tap two untapped Wizards you control: Tap target permanent.",
    },
  ],
});
