import { defineCard } from "../define.js";

// An adventurer card (Two-Handed Axe's shape): Allure of Power is its
// Adventure, in `allure-of-power.ts`. "Can't be blocked" is the
// `unblockable` keyword.
const STATIC_TEXT = "Equipped creature has hexproof and can't be blocked.";
const EQUIP_TEXT = "Equip—{2}, Pay 2 life.";

export default defineCard({
  name: "My Precious",
  manaCost: "{3}",
  colors: [],
  supertypes: ["legendary"],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: `${STATIC_TEXT}\n${EQUIP_TEXT}`,
  static: [
    {
      affects: { scope: "attached" },
      grantKeywords: ["hexproof", "unblockable"],
      text: STATIC_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{2}", tap: false, payLife: 2 },
      targets: ["creature-you-control"],
      effect: { kind: "attach", target: 0 },
      resolve: null,
      text: EQUIP_TEXT,
      sorcerySpeed: true,
    },
  ],
  faces: ["My Precious", "Allure of Power"],
  adventure: true,
});
