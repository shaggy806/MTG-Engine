import { defineCard } from "../define.js";

export default defineCard({
  name: "Topan Ascetic",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Human", "Monk"],
  power: 2,
  toughness: 2,
  text: "Tap an untapped creature you control: This creature gets +1/+1 until end of turn.",
  activated: [
    {
      cost: {
        mana: null,
        tap: false,
        tapOthers: { count: 1, filter: { type: "creature", controlledBy: "you" }, includeSelf: true },
      },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: 1, duration: "end-of-turn" },
      resolve: null,
      text: "Tap an untapped creature you control: This creature gets +1/+1 until end of turn.",
    },
  ],
});
