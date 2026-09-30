import { defineCard } from "../define.js";
import { ward } from "../helpers.js";

const WARD_TEXT = "Commanders you control have ward {2}.";
const MANA_TEXT = "{T}: Add {W}{W}. Spend this mana only to cast Aura and/or Equipment spells.";
const ATTACH_TEXT =
  "{T}: Attach target Aura or Equipment you control to target creature you control. Activate only as a sorcery.";

const AURA_OR_EQUIPMENT = { anyOf: [{ subtype: "Aura" }, { subtype: "Equipment" }] } as const;

// The mana pays for Aura and Equipment *spells* only — never an equip cost
// (its ruling). The attach needs both targets legal; one that can't legally
// go on the creature doesn't move (`attach`, rule 301.5c).
export default defineCard({
  name: "Codsworth, Handy Helper",
  manaCost: "{2}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["artifact", "creature"],
  subtypes: ["Robot"],
  power: 2,
  toughness: 3,
  text: `${WARD_TEXT}\n${MANA_TEXT}\n${ATTACH_TEXT}`,
  static: [
    {
      affects: { scope: "filter", filter: { isCommander: true, controlledBy: "you" } },
      grantsTriggered: [ward({ mana: "{2}" })],
      text: WARD_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: {
        kind: "add-mana",
        mana: { all: ["W", "W"] },
        amount: 1,
        spendOnly: {
          spell: AURA_OR_EQUIPMENT,
          text: "Spend this mana only to cast Aura and/or Equipment spells.",
        },
      },
      resolve: null,
      text: MANA_TEXT,
    },
    {
      cost: { mana: null, tap: true },
      sorcerySpeed: true,
      targets: [{ kind: "permanent", whose: "you", filter: AURA_OR_EQUIPMENT }, "creature-you-control"],
      effect: { kind: "attach", target: 1, attachment: 0 },
      resolve: null,
      text: ATTACH_TEXT,
    },
  ],
});
