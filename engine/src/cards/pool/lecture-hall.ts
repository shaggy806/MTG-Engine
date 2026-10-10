import { defineCard } from "../define.js";
import { ROOM_REMINDER } from "../helpers.js";

// The right door of Restricted Office // Lecture Hall (restricted-office-lecture-hall.ts).
const HEXPROOF = "Other permanents you control have hexproof.";

export default defineCard({
  name: "Lecture Hall",
  manaCost: "{5}{U}{U}",
  colors: ["U"],
  types: ["enchantment"],
  subtypes: ["Room"],
  text: `${HEXPROOF}\n${ROOM_REMINDER}`,
  static: [
    {
      affects: { scope: "filter", filter: { controlledBy: "you" }, excludeSelf: true },
      grantKeywords: ["hexproof"],
      text: HEXPROOF,
    },
  ],
  faces: ["Restricted Office // Lecture Hall", "Restricted Office", "Lecture Hall"],
  split: true,
});
