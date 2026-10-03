import { defineCard } from "../define.js";

// - The doubling is Teysa Karlov's `doubleTriggers` keyed on a creature
//   dying: its own dies and leaves-the-battlefield triggers, and every other
//   trigger its death causes; "whenever you sacrifice a creature" isn't caused
//   by the dying and triggers once. A creature dying at the same time as
//   Drivnod, Drivnod included, still triggers an additional time, and two
//   Drivnods make three, not four (its rulings).
// - The three creature cards the counter costs are picked as the ability goes
//   on the stack.
const DOUBLE_TEXT =
  "If a creature dying causes a triggered ability of a permanent you control to trigger, that ability triggers an additional time.";
const COUNTER_TEXT =
  "{B/P}{B/P}, Exile three creature cards from your graveyard: Put an indestructible counter on Drivnod. ({B/P} can be paid with either {B} or 2 life.)";

export default defineCard({
  name: "Drivnod, Carnage Dominus",
  manaCost: "{3}{B}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Phyrexian", "Horror"],
  power: 8,
  toughness: 3,
  text: `${DOUBLE_TEXT}\n${COUNTER_TEXT}`,
  static: [
    { affects: { scope: "self" }, doubleTriggers: { cause: "dies", filter: { type: "creature" } }, text: DOUBLE_TEXT },
  ],
  activated: [
    {
      cost: {
        mana: "{B/P}{B/P}",
        tap: false,
        exileFromGraveyard: { count: 3, filter: { type: "creature" } },
      },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "indestructible", amount: 1 },
      resolve: null,
      text: COUNTER_TEXT,
    },
  ],
});
