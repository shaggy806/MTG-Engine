import { defineCard } from "../define.js";

export default defineCard({
  name: "Lodestone Myr",
  manaCost: "{4}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Myr"],
  power: 2,
  toughness: 2,
  keywords: ["trample"],
  text: "Trample\nTap an untapped artifact you control: This creature gets +1/+1 until end of turn.",
  activated: [
    {
      cost: {
        mana: null,
        tap: false,
        tapOthers: { count: 1, filter: { type: "artifact", controlledBy: "you" }, includeSelf: true },
      },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: 1, duration: "end-of-turn" },
      resolve: null,
      text: "Tap an untapped artifact you control: This creature gets +1/+1 until end of turn.",
    },
  ],
});
