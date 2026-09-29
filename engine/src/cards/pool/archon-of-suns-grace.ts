import { defineCard } from "../define.js";

const PEGASUS_TEXT = "Pegasus creatures you control have lifelink.";
const CONSTELLATION_TEXT =
  "Constellation — Whenever an enchantment you control enters, create a 2/2 white Pegasus creature token with flying.";

export default defineCard({
  name: "Archon of Sun's Grace",
  manaCost: "{2}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Archon"],
  power: 3,
  toughness: 4,
  keywords: ["flying", "lifelink"],
  text: `Flying\nLifelink\n${PEGASUS_TEXT}\n${CONSTELLATION_TEXT}`,
  static: [
    {
      affects: { scope: "creatures-you-control", subtype: "Pegasus" },
      grantKeywords: ["lifelink"],
      text: PEGASUS_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "enchantment" } },
      targets: [],
      effect: { kind: "create-token", token: "2/2 Pegasus Token", count: 1 },
      resolve: null,
      text: CONSTELLATION_TEXT,
    },
  ],
});
