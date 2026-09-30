import { defineCard } from "../define.js";
import { equip } from "../helpers.js";

const ENTER_TEXT =
  "When this Equipment enters, attach it to target creature you control. That creature gains shroud until end of turn.";
const STATIC_TEXT = "Equipped creature can't be blocked.";

export default defineCard({
  name: "Silver Shroud Costume",
  manaCost: "{2}",
  types: ["artifact"],
  subtypes: ["Equipment"],
  keywords: ["flash"],
  text: `Flash\n${ENTER_TEXT} (It can't be the target of spells or abilities.)\n${STATIC_TEXT}\nEquip {3}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["creature-you-control"],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "attach", target: 0, attachment: "source" },
          { kind: "grant-keyword", target: 0, keyword: "shroud", duration: "end-of-turn" },
        ],
      },
      resolve: null,
      text: ENTER_TEXT,
    },
  ],
  static: [{ affects: { scope: "attached" }, grantKeywords: ["unblockable"], text: STATIC_TEXT }],
  activated: [equip("{3}")],
});
