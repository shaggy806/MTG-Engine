import { defineCard } from "../define.js";

export default defineCard({
  name: "Scrapyard Steelbreaker",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["artifact", "creature"],
  subtypes: ["Human", "Warrior"],
  power: 3,
  toughness: 4,
  text: "{1}, Sacrifice another artifact: This creature gets +2/+1 until end of turn.",
  activated: [
    {
      cost: { mana: "{1}", tap: false, sacrifice: { filter: { type: "artifact" } } },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 2, toughness: 1, duration: "end-of-turn" },
      resolve: null,
      text: "{1}, Sacrifice another artifact: This creature gets +2/+1 until end of turn.",
      otherOnly: true,
    },
  ],
});
