import { defineCard } from "../define.js";

const ANTHEM_TEXT = "Other enchantment creatures you control get +1/+1.";
const COPY_TEXT =
  "{G}, {T}: Copy target activated or triggered ability you control from an enchantment source. You may choose " +
  "new targets for the copy. (Mana abilities can't be targeted.)";

// "From an enchantment source" is the ability's source as it is — or as it
// last existed on the battlefield, once it has left — and includes an
// enchantment card's abilities from other zones, a channel ability's (the
// ruling). The copy has that source too (rule 707.10b).
export default defineCard({
  name: "Weaver of Harmony",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["enchantment", "creature"],
  subtypes: ["Snake", "Druid"],
  power: 2,
  toughness: 2,
  text: `${ANTHEM_TEXT}\n${COPY_TEXT}`,
  static: [
    {
      affects: { scope: "filter", filter: { types: ["enchantment", "creature"], controlledBy: "you" }, excludeSelf: true },
      grantPt: [1, 1],
      text: ANTHEM_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{G}", tap: true },
      targets: [{ kind: "ability", whose: "you", sourceTypes: ["enchantment"] }],
      effect: { kind: "copy-ability", target: 0, newTargets: true },
      resolve: null,
      text: COPY_TEXT,
    },
  ],
});
