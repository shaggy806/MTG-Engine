import { defineCard } from "../define.js";

const SEARCH_TEXT =
  "When this creature enters, you may search your library for a creature card with mana value 1 or less, reveal it, put it into your hand, then shuffle.";
const LOCK_TEXT = "Sacrifice this creature: Your opponents can't cast noncreature spells this turn.";

// The lock binds casting from the moment it resolves: spells already on the
// stack, or cast in response, are untouched (the ruling).
export default defineCard({
  name: "Ranger-Captain of Eos",
  manaCost: "{1}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Soldier", "Ranger"],
  power: 3,
  toughness: 3,
  text: `${SEARCH_TEXT}\n${LOCK_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { type: "creature", manaValue: { op: "lte", n: 1 } },
        destination: "hand",
        min: 0,
        max: 1,
        reveal: true,
      },
      resolve: null,
      text: SEARCH_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: "self" },
      targets: [],
      effect: {
        kind: "prohibit",
        who: "each-opponent",
        spells: { filter: { notTypes: ["creature"] }, label: "noncreature spells" },
      },
      resolve: null,
      text: LOCK_TEXT,
    },
  ],
});
