import { defineCard } from "../define.js";

// EDHREC rank 6300.

export default defineCard({
  name: "Samut, Voice of Dissent",
  manaCost: "{3}{R}{G}",
  colors: ["R", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Warrior"],
  power: 3,
  toughness: 4,
  keywords: ["flash", "double-strike", "vigilance", "haste"],
  text: "Flash\nDouble strike, vigilance, haste\nOther creatures you control have haste.\n{W}, {T}: Untap another target creature.",
  activated: [
    {
      cost: { mana: "{W}", tap: true },
      targets: [{ kind: "other", of: "creature" }],
      effect: { kind: "untap", target: 0 },
      resolve: null,
      text: "{W}, {T}: Untap another target creature.",
    },
  ],
  static: [
    {
      affects: { scope: "creatures-you-control", excludeSelf: true },
      grantKeywords: ["haste"],
      text: "Other creatures you control have haste.",
    },
  ],
});
