import { defineCard } from "../define.js";

const TEXT = "Commander creatures you control get +2/+2 and have indestructible.";

// Any commander creature you control, whoever owns it; a commander that
// isn't a creature right now isn't one (the rulings).
export default defineCard({
  name: "Bastion Protector",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 3,
  toughness: 3,
  text: TEXT,
  static: [
    {
      affects: { scope: "filter", filter: { type: "creature", isCommander: true, controlledBy: "you" } },
      grantPt: [2, 2],
      grantKeywords: ["indestructible"],
      text: TEXT,
    },
  ],
});
