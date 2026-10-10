import { defineCard } from "../define.js";
import { ROOM_REMINDER } from "../helpers.js";

// The right door of Mirror Room // Fractured Realm (mirror-room-fractured-realm.ts). Annie Joins Up's shape, for every permanent you control.
const DOUBLE = "If a triggered ability of a permanent you control triggers, that ability triggers an additional time.";

export default defineCard({
  name: "Fractured Realm",
  manaCost: "{5}{U}{U}",
  colors: ["U"],
  types: ["enchantment"],
  subtypes: ["Room"],
  text: `${DOUBLE}\n${ROOM_REMINDER}`,
  static: [
    {
      affects: { scope: "self" },
      doubleTriggersOf: { filter: { controlledBy: "you" } },
      text: DOUBLE,
    },
  ],
  faces: ["Mirror Room // Fractured Realm", "Mirror Room", "Fractured Realm"],
  split: true,
});
