import { equip } from "../helpers.js";
import { defineCard } from "../define.js";

// EDHREC rank 6111.

const ENTER_TEXT =
  "When this Equipment enters, attach it to target creature you control. If that creature is an Assassin, it gains deathtouch until end of turn.";
const STATIC_TEXT = "Equipped creature gets +1/+0 and has first strike.";

export default defineCard({
  name: "Hidden Blade",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Equipment"],
  keywords: ["flash"],
  text: `Flash\n${ENTER_TEXT}\n${STATIC_TEXT}\nEquip {2}`,
  activated: [equip("{2}")],
  triggered: [
    {
      // Celestial Armor's attach-on-enter, and Ancient Animus's check of
      // what the target is as the ability resolves.
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["creature-you-control"],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "attach", target: 0, attachment: "source" },
          {
            kind: "conditional",
            condition: { kind: "target", index: 0, filter: { subtype: "Assassin" } },
            then: { kind: "grant-keyword", target: 0, keyword: "deathtouch", duration: "end-of-turn" },
          },
        ],
      },
      resolve: null,
      text: ENTER_TEXT,
    },
  ],
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [1, 0],
      grantKeywords: ["first-strike"],
      text: STATIC_TEXT,
    },
  ],
});
