import { defineCard } from "../define.js";
import { ROOM_REMINDER, unlockThisDoor } from "../helpers.js";

// The left door of Mirror Room // Fractured Realm (mirror-room-fractured-realm.ts).
const UNLOCK =
  "When you unlock this door, create a token that's a copy of target creature you control, except it's a Reflection in addition to its other creature types.";

export default defineCard({
  name: "Mirror Room",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["enchantment"],
  subtypes: ["Room"],
  text: `${UNLOCK}\n${ROOM_REMINDER}`,
  triggered: [
    {
      trigger: unlockThisDoor("left"),
      targets: ["creature-you-control"],
      effect: {
        kind: "create-token-copy",
        of: 0,
        count: 1,
        who: "you",
        exceptions: { addSubtypes: ["Reflection"] },
      },
      resolve: null,
      text: UNLOCK,
    },
  ],
  faces: ["Mirror Room // Fractured Realm", "Mirror Room", "Fractured Realm"],
  split: true,
});
