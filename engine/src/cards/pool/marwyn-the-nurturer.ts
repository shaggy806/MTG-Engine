import { defineCard } from "../define.js";

// Top-commanders rank 337. The mana ability's amount is Marwyn's power as it
// stands when the ability is activated (rule 605.3a) — counters, anthems and
// shrinks all count, and 0 or less makes nothing. The auto-payer sizes it the
// same way (`manaSources`), so a big Marwyn pays for a big spell on her own.
const ENTERS_TEXT =
  "Whenever another Elf you control enters, put a +1/+1 counter on Marwyn, the Nurturer.";
const MANA_TEXT = "{T}: Add an amount of {G} equal to Marwyn's power.";

export default defineCard({
  name: "Marwyn, the Nurturer",
  manaCost: "{2}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elf", "Druid"],
  power: 1,
  toughness: 1,
  text: `${ENTERS_TEXT}\n${MANA_TEXT}`,
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you",
        filter: { subtype: "Elf", controlledBy: "you" },
        otherOnly: true,
      },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: ENTERS_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "G", amount: { powerOf: "source" } },
      resolve: null,
      text: MANA_TEXT,
    },
  ],
});
