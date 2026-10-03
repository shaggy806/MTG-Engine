import { defineCard } from "../define.js";

const ETB_TEXT = "When this creature enters, create a 1/1 colorless Thopter artifact creature token with flying.";
const HASTE_TEXT = "Artifact creatures you control have haste.";

export default defineCard({
  name: "Thopter Engineer",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Artificer"],
  power: 1,
  toughness: 3,
  text: `${ETB_TEXT}\n${HASTE_TEXT} (They can attack and {T} as soon as they come under your control.)`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Thopter Token", count: 1 },
      resolve: null,
      text: ETB_TEXT,
    },
  ],
  static: [
    {
      affects: { scope: "filter", filter: { types: ["artifact", "creature"], controlledBy: "you" } },
      grantKeywords: ["haste"],
      text: HASTE_TEXT,
    },
  ],
});
