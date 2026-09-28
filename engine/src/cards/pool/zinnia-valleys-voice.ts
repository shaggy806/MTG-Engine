import { defineCard } from "../define.js";

// Base power (ruling): the printed power, or what an effect *sets* it to —
// a characteristic-defining ability included, a modification not. The
// granted offspring is its own additional cost, beside a creature's own
// kicker or offspring (rule 702.175b); paid, the creature enters with
// offspring's trigger, and the 1/1 copy isn't cast, so gets none of its own.
const PT_TEXT = "Zinnia gets +X/+0, where X is the number of other creatures you control with base power 1.";
const GRANT_TEXT =
  "Creature spells you cast gain offspring {2} as you cast them. (You may pay an additional {2} as you cast a creature spell. If you do, when that creature enters, create a 1/1 token copy of it.)";

export default defineCard({
  name: "Zinnia, Valley's Voice",
  manaCost: "{U}{R}{W}",
  colors: ["U", "R", "W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Bird", "Bard"],
  power: 1,
  toughness: 3,
  keywords: ["flying"],
  text: `Flying\n${PT_TEXT}\n${GRANT_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      grantPtPerCount: {
        filter: { type: "creature", controlledBy: "you", basePower: { op: "eq", n: 1 } },
        excludeSelf: true,
        pt: [1, 0],
      },
      text: PT_TEXT,
    },
    {
      affects: { scope: "self" },
      grantsOffspringToSpells: { cost: "{2}", filter: { type: "creature" } },
      text: GRANT_TEXT,
    },
  ],
});
