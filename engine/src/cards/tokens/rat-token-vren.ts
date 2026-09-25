import { defineCard } from "../define.js";

// Vren, the Relentless's 1/1 black Rat, which grows with the others.
export default defineCard({
  name: "Rat Token (Vren)",
  art: "1c0977b2-3342-4b7e-b1c7-f06bd8ab7fbf",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Rat"],
  power: 1,
  toughness: 1,
  text: "This token gets +1/+1 for each other Rat you control.",
  static: [
    {
      affects: { scope: "self" },
      grantPtPerCount: {
        filter: { subtype: "Rat", controlledBy: "you" },
        pt: [1, 1],
        excludeSelf: true,
      },
      text: "This token gets +1/+1 for each other Rat you control.",
    },
  ],
});
