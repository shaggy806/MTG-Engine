import { defineCard } from "../define.js";

export default defineCard({
  name: "Sunscape Master",
  manaCost: "{2}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 2,
  toughness: 2,
  text: "{G}{G}, {T}: Creatures you control get +2/+2 until end of turn.\n{U}{U}, {T}: Return target creature to its owner's hand.",
  activated: [
    {
      cost: { mana: "{G}{G}", tap: true },
      targets: [],
      effect: {
        kind: "modify-pt-all",
        filter: { type: "creature", controlledBy: "you" },
        power: 2,
        toughness: 2,
        duration: "end-of-turn",
      },
      resolve: null,
      text: "{G}{G}, {T}: Creatures you control get +2/+2 until end of turn.",
    },
    {
      cost: { mana: "{U}{U}", tap: true },
      targets: ["creature"],
      effect: { kind: "return-to-hand", target: 0 },
      resolve: null,
      text: "{U}{U}, {T}: Return target creature to its owner's hand.",
    },
  ],
});
