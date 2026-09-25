import { defineCard } from "../define.js";

export default defineCard({
  name: "Sunmane Pegasus",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Pegasus"],
  power: 2,
  toughness: 3,
  keywords: ["flying"],
  text: "Flying\n{1}{W}: This creature gains vigilance and lifelink until end of turn. (Attacking doesn't cause it to tap. Damage dealt by it also causes you to gain that much life.)",
  activated: [
    {
      cost: { mana: "{1}{W}", tap: false },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          {
            kind: "grant-keyword",
            target: "source",
            keyword: "vigilance",
            duration: "end-of-turn",
          },
          {
            kind: "grant-keyword",
            target: "source",
            keyword: "lifelink",
            duration: "end-of-turn",
          },
        ],
      },
      resolve: null,
      text: "{1}{W}: This creature gains vigilance and lifelink until end of turn.",
    },
  ],
});
