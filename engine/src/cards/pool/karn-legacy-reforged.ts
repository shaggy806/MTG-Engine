import { defineCard } from "../define.js";

// EDHREC rank 2523.
//
// The CDA is `greatestManaValueOf` (test/greatest-mana-value-cda.test.ts).
// The upkeep mana is a triggered ability, not a mana ability — it uses the
// stack, and the artifacts are counted as it resolves (the ruling). The
// mana is deny-listed for nonartifact spells (`notSpell`) and `persists`
// through the turn's steps and phases, emptied at cleanup.
//
// Rulings:
//   [2023-05-12] The mana produced by Karn's last ability can be spent on anything that isn't a
//     nonartifact spell. This includes casting artifact spells, paying costs to activate abilities
//     of both artifact and nonartifact permanents, paying ward costs, and so on.
//   [2023-05-12] Karn's last ability isn't a mana ability, even though it adds mana. It uses the
//     stack and it can be responded to. Use the number of artifacts you control as the ability
//     resolves to determine how much mana to add.
//   [2023-05-12] The ability that defines Karn's power and toughness works in all zones, not just
//     the battlefield. As long as Karn is under your control and still an artifact, its own mana
//     value will count. In most cases, it'll be at least 5/5.

const PT_TEXT = "Karn's power and toughness are each equal to the greatest mana value among artifacts you control.";
const UPKEEP_TEXT =
  "At the beginning of your upkeep, add {C} for each artifact you control. This mana can't be spent to cast nonartifact spells. Until end of turn, you don't lose this mana as steps and phases end.";

export default defineCard({
  name: "Karn, Legacy Reforged",
  manaCost: "{5}",
  colors: [],
  supertypes: ["legendary"],
  types: ["artifact", "creature"],
  subtypes: ["Golem"],
  power: 0,
  toughness: 0,
  text: `${PT_TEXT}\n${UPKEEP_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      setBasePtFromCount: {
        countOf: { greatestManaValueOf: { type: "artifact", controlledBy: "you" } },
        plusPower: 0,
        plusToughness: 0,
      },
      text: PT_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: {
        kind: "add-mana",
        mana: "C",
        amount: { countOf: { type: "artifact", controlledBy: "you" } },
        persists: true,
        spendOnly: { notSpell: { notTypes: ["artifact"] }, text: "This mana can't be spent to cast nonartifact spells." },
      },
      resolve: null,
      text: UPKEEP_TEXT,
    },
  ],
});
