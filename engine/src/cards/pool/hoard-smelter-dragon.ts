import { defineCard } from "../define.js";

export default defineCard({
  name: "Hoard-Smelter Dragon",
  manaCost: "{4}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 5,
  toughness: 5,
  keywords: ["flying"],
  text: "Flying\n{3}{R}: Destroy target artifact. This creature gets +X/+0 until end of turn, where X is that artifact's mana value.",
  activated: [
    {
      cost: { mana: "{3}{R}", tap: false },
      targets: ["artifact"],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "destroy", target: 0 },
          {
            kind: "modify-pt",
            target: "source",
            power: { manaValueOf: 0 },
            toughness: 0,
            duration: "end-of-turn",
          },
        ],
      },
      resolve: null,
      text: "{3}{R}: Destroy target artifact. This creature gets +X/+0 until end of turn, where X is that artifact's mana value.",
    },
  ],
});
