import { defineCard } from "../define.js";

// #466 in top-commanders.txt.
//
// "Creatures can't block this turn" is a rule for the rest of the turn over
// every creature, one that enters later included (rule 611.2c).
const ENTER_TEXT = "When Aragorn enters, you become the monarch.";
const ATTACK_TEXT =
  "Whenever Aragorn attacks, up to one target creature can't block this turn. If you're the monarch, " +
  "creatures can't block this turn.";

export default defineCard({
  name: "Aragorn, King of Gondor",
  manaCost: "{1}{U}{R}{W}",
  colors: ["U", "R", "W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Noble"],
  power: 4,
  toughness: 4,
  keywords: ["vigilance", "lifelink"],
  text: `Vigilance, lifelink\n${ENTER_TEXT}\n${ATTACK_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "become-monarch" },
      resolve: null,
      text: ENTER_TEXT,
    },
    {
      trigger: { on: "attacks", who: "self" },
      targets: [{ kind: "optional", of: "creature" }],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "restrict", target: 0, restrictions: ["cant-block"] },
          {
            kind: "conditional",
            condition: { kind: "monarch", who: "you" },
            then: { kind: "restrict", filter: { type: "creature" }, restrictions: ["cant-block"] },
          },
        ],
      },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
});
