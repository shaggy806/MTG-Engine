import { defineCard } from "../define.js";

// Commander backlog (top-commanders.txt). Delve applies once the total cost
// is set (rule 702.66b, the 2025-04-04 ruling), pays generic mana including
// {X}'s, and reaches spells cast from anywhere. The life lost reads the
// spell's mana value on the stack, X as chosen (ruling).
const DELVE_TEXT =
  "Spells you cast have delve. (Each card you exile from your graveyard while casting those spells pays for {1}.)";
const LOSE_TEXT = "Whenever you cast a spell, you lose life equal to its mana value.";

export default defineCard({
  name: "Teval, Arbiter of Virtue",
  manaCost: "{2}{B}{G}{U}",
  colors: ["B", "G", "U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Spirit", "Dragon"],
  power: 6,
  toughness: 6,
  keywords: ["flying", "lifelink"],
  text: `Flying, lifelink\n${DELVE_TEXT}\n${LOSE_TEXT}`,
  static: [{ affects: { scope: "self" }, spellsHaveDelve: true, text: DELVE_TEXT }],
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you" },
      targets: [],
      effect: { kind: "lose-life", amount: { manaValueOf: "trigger-object" }, who: "you" },
      resolve: null,
      text: LOSE_TEXT,
    },
  ],
});
