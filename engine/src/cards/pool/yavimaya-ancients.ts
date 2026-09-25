import { defineCard } from "../define.js";

export default defineCard({
  name: "Yavimaya Ancients",
  manaCost: "{3}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Treefolk"],
  power: 2,
  toughness: 7,
  text: "{G}: This creature gets +1/-2 until end of turn.",
  activated: [
    {
      cost: { mana: "{G}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: -2, duration: "end-of-turn" },
      resolve: null,
      text: "{G}: This creature gets +1/-2 until end of turn.",
    },
  ],
});
