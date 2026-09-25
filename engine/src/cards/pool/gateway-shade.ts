import { defineCard } from "../define.js";

export default defineCard({
  name: "Gateway Shade",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Shade"],
  power: 1,
  toughness: 1,
  text: "{B}: This creature gets +1/+1 until end of turn.\nTap an untapped Gate you control: This creature gets +2/+2 until end of turn.",
  activated: [
    {
      cost: { mana: "{B}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: 1, duration: "end-of-turn" },
      resolve: null,
      text: "{B}: This creature gets +1/+1 until end of turn.",
    },
    {
      cost: {
        mana: null,
        tap: false,
        tapOthers: { count: 1, filter: { subtype: "Gate", controlledBy: "you" }, includeSelf: true },
      },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 2, toughness: 2, duration: "end-of-turn" },
      resolve: null,
      text: "Tap an untapped Gate you control: This creature gets +2/+2 until end of turn.",
    },
  ],
});
