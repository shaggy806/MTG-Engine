import { defineCard } from "../define.js";

export default defineCard({
  name: "Drana's Chosen",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Vampire", "Shaman", "Ally"],
  power: 2,
  toughness: 2,
  text: "Cohort — {T}, Tap an untapped Ally you control: Create a tapped 2/2 black Zombie creature token.",
  activated: [
    {
      cost: {
        mana: null,
        tap: true,
        tapOthers: { count: 1, filter: { subtype: "Ally", controlledBy: "you" } },
      },
      targets: [],
      effect: { kind: "create-token", token: "Zombie Token", count: 1, tapped: true },
      resolve: null,
      text: "Cohort — {T}, Tap an untapped Ally you control: Create a tapped 2/2 black Zombie creature token.",
    },
  ],
});
