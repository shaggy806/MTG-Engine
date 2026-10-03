import { defineCard } from "../define.js";
import { flanking } from "../helpers.js";

const FLANKING_TEXT =
  "Flanking (Whenever a creature without flanking blocks this creature, the blocking creature gets -1/-1 until end of turn.)";
const BLOCK_TEXT = "Creatures your opponents control without flying or reach can't block creatures with power 2 or less.";

// The restriction is on any creature with power 2 or less, whoever controls
// it — an opponent's creature attacking another opponent too (the ruling) —
// and is read as blockers are declared: power changing afterwards undoes no
// block. "Without flying or reach" is neither: the second `notKeyword` rides
// in a one-member `anyOf`.
export default defineCard({
  name: "Sidar Kondo of Jamuraa",
  manaCost: "{2}{G}{W}",
  colors: ["G", "W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Knight"],
  power: 2,
  toughness: 5,
  keywords: ["flanking"],
  pairing: { kind: "partner" },
  text: `${FLANKING_TEXT}\n${BLOCK_TEXT}\nPartner (You can have two commanders if both have partner.)`,
  static: [
    {
      affects: { scope: "filter", filter: { type: "creature", power: { op: "lte", n: 2 } } },
      cantBeBlockedBy: {
        type: "creature",
        controlledBy: "opponent",
        notKeyword: "flying",
        anyOf: [{ notKeyword: "reach" }],
      },
      text: BLOCK_TEXT,
    },
  ],
  triggered: [{ ...flanking(), text: FLANKING_TEXT }],
});
