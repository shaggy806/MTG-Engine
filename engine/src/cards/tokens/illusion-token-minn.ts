import { defineCard } from "../define.js";

// Minn, Wily Illusionist's 1/1 blue Illusion, which grows with the others.
export default defineCard({
  name: "Illusion Token (Minn)",
  art: "42a6bc0b-e76d-4c45-b39d-0186d9bc9c42",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Illusion"],
  power: 1,
  toughness: 1,
  text: "This token gets +1/+0 for each other Illusion you control.",
  static: [
    {
      affects: { scope: "self" },
      grantPtPerCount: {
        filter: { subtype: "Illusion", controlledBy: "you" },
        pt: [1, 0],
        excludeSelf: true,
      },
      text: "This token gets +1/+0 for each other Illusion you control.",
    },
  ],
});
