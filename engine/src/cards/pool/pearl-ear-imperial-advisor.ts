import { defineCard } from "../define.js";
import { grantAffinity } from "../helpers.js";

// The rulings this follows: every Aura you control counts toward affinity,
// even one on an opponent's permanent, and two grants both apply; a
// permanent is modified by any counter, by any Equipment attached to it, or
// by an Aura you control attached to it — not by an opponent's Aura, nor by
// the Aura spell targeting it.
const AFFINITY_TEXT =
  "Enchantment spells you cast have affinity for Auras. (They cost {1} less to cast for each Aura you control.)";
const DRAW_TEXT =
  "Whenever you cast an Aura spell that targets a modified permanent you control, draw a card. " +
  "(Equipment, Auras you control, and counters are modifications.)";

export default defineCard({
  name: "Pearl-Ear, Imperial Advisor",
  manaCost: "{1}{W}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Fox", "Advisor"],
  power: 3,
  toughness: 4,
  keywords: ["lifelink"],
  text: `Lifelink\n${AFFINITY_TEXT}\n${DRAW_TEXT}`,
  static: [grantAffinity({ type: "enchantment" }, { subtype: "Aura" }, AFFINITY_TEXT)],
  triggered: [
    {
      trigger: {
        on: "cast-spell",
        who: "you",
        filter: { subtype: "Aura", targets: { permanent: { modified: true, controlledBy: "you" } } },
      },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
});
