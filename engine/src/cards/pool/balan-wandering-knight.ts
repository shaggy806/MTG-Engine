import { defineCard } from "../define.js";

const STRIKE_TEXT = "Balan has double strike as long as two or more Equipment are attached to it.";
const ATTACH_TEXT = "{1}{W}: Attach all Equipment you control to Balan.";

// Any Equipment attached counts toward double strike, whoever controls it;
// the activation moves only the Equipment you control, each that can legally
// equip Balan (rule 701.3b). Not an equip ability, so any time you could cast
// an instant.
export default defineCard({
  name: "Balan, Wandering Knight",
  manaCost: "{2}{W}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Cat", "Knight"],
  power: 3,
  toughness: 3,
  keywords: ["first-strike"],
  text: `First strike\n${STRIKE_TEXT}\n${ATTACH_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      condition: { kind: "source", filter: { equipmentAttached: { op: "gte", n: 2 } } },
      grantKeywords: ["double-strike"],
      text: STRIKE_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{1}{W}", tap: false },
      targets: [],
      effect: {
        kind: "attach",
        target: "source",
        attachments: { subtype: "Equipment", controlledBy: "you" },
      },
      resolve: null,
      text: ATTACH_TEXT,
    },
  ],
});
