import { defineCard } from "../define.js";

// Urza, Chief Artificer's token. Its P/T is a layer-7d bonus over a printed
// 0/0, not a CDA: "This token gets +1/+1 for each artifact you control"
// counts itself, since it's an artifact.
export default defineCard({
  name: "Construct Token",
  types: ["artifact", "creature"],
  subtypes: ["Construct"],
  power: 0,
  toughness: 0,
  text: "This token gets +1/+1 for each artifact you control.",
  static: [
    {
      affects: { scope: "self" },
      grantPtPerCount: { filter: { type: "artifact", controlledBy: "you" }, pt: [1, 1] },
      text: "This token gets +1/+1 for each artifact you control.",
    },
  ],
});
