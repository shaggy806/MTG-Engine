import { defineCard } from "../define.js";

export default defineCard({
  name: "Skycat Sovereign",
  manaCost: "{W}{U}",
  colors: ["W", "U"],
  types: ["creature"],
  subtypes: ["Elemental", "Cat"],
  power: 1,
  toughness: 1,
  keywords: ["flying"],
  text:
    "Flying\n" +
    "Skycat Sovereign gets +1/+1 for each other creature you control with flying.\n" +
    "{2}{W}{U}: Create a 1/1 white Cat Bird creature token with flying.",
  static: [
    {
      affects: { scope: "self" },
      grantPtPerCount: {
        filter: { type: "creature", controlledBy: "you", keyword: "flying" },
        pt: [1, 1],
        // "**Other**" — the Sovereign is itself a flier.
        excludeSelf: true,
      },
      text: "Skycat Sovereign gets +1/+1 for each other creature you control with flying.",
    },
  ],
  activated: [
    {
      cost: { mana: "{2}{W}{U}", tap: false },
      targets: [],
      effect: { kind: "create-token", token: "Cat Bird Token", count: 1 },
      resolve: null,
      text: "{2}{W}{U}: Create a 1/1 white Cat Bird creature token with flying.",
    },
  ],
});
