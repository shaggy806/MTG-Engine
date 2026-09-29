import { defineCard } from "../define.js";
import { ward } from "../helpers.js";

const EXILE_TEXT =
  "When this Aura enters, exile target nonland permanent an opponent controls until this Aura leaves the battlefield.";
const STATIC_TEXT = "Enchanted creature gets +1/+0 and has lifelink and ward {2}.";

// Rule 610.3c: if the Aura has left before its trigger resolves, nothing is
// exiled at all (the ruling). A token exiled this way ceases to exist.
export default defineCard({
  name: "Sheltered by Ghosts",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: `Enchant creature you control\n${EXILE_TEXT}\n${STATIC_TEXT}`,
  targets: ["creature-you-control"],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["nonland-permanent-an-opponent-controls"],
      effect: { kind: "exile", target: 0, untilSourceLeaves: true },
      resolve: null,
      text: EXILE_TEXT,
    },
    {
      trigger: { on: "leaves-battlefield", who: "self" },
      targets: [],
      effect: { kind: "return-exiled-by-source" },
      resolve: null,
      text: "When this Aura leaves the battlefield, return the exiled card.",
    },
  ],
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [1, 0],
      grantKeywords: ["lifelink"],
      grantsTriggered: [ward({ mana: "{2}" })],
      text: STATIC_TEXT,
    },
  ],
});
