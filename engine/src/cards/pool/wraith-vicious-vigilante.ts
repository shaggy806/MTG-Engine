import { defineCard } from "../define.js";

export default defineCard({
  name: "Wraith, Vicious Vigilante",
  manaCost: "{1}{W}{U}",
  colors: ["W", "U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Detective", "Hero"],
  power: 1,
  toughness: 1,
  keywords: ["double-strike"],
  text: "Double strike\nFear Gas — Wraith can't be blocked.",
  static: [
    {
      affects: { scope: "self" },
      grantKeywords: ["unblockable"],
      text: "Fear Gas — Wraith can't be blocked.",
    },
  ],
});
