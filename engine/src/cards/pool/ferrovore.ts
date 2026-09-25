import { defineCard } from "../define.js";

export default defineCard({
  name: "Ferrovore",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Beast"],
  power: 2,
  toughness: 2,
  text: "{R}, Sacrifice an artifact: This creature gets +3/+0 until end of turn.",
  activated: [
    {
      cost: { mana: "{R}", tap: false, sacrifice: { filter: { type: "artifact" } } },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 3, toughness: 0, duration: "end-of-turn" },
      resolve: null,
      text: "{R}, Sacrifice an artifact: This creature gets +3/+0 until end of turn.",
    },
  ],
});
