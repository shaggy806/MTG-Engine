import { defineCard } from "../define.js";

// EDHREC rank 4619.
//
// Rulings:
//   [2025-06-06] Once the number of lore counters on a Saga is greater than or equal to the
//     greatest number among its chapter abilities, the Saga's controller sacrifices it as soon as
//     its chapter ability has left the stack, most likely by resolving or being countered. This
//     state-based action doesn't use the stack.
//   [2025-06-06] Each symbol on the left of a Saga's text box represents a chapter ability. A
//     chapter ability is a triggered ability that triggers when a lore counter that is put on the
//     Saga causes the number of lore counters on the Saga to become equal to or greater than the
//     ability's chapter number. Chapter abilities are put onto the stack and may be responded to.
//   [2025-06-06] Once a chapter ability has triggered, the ability on the stack won't be affected
//     if the Saga gains or loses counters, or if it leaves the battlefield.
//   [2025-06-06] As a Saga enters, its controller puts a lore counter on it. As your first main
//     phase begins (immediately after your draw step), you put another lore counter on each Saga
//     you control. Putting a lore counter on a Saga in either of these ways doesn't use the stack.
//   [2025-06-06] Saga creatures have two sections to their text boxes. The first section, above
//     the type line, contains their chapter abilities, and the second section, below the type
//     line, contains any other abilities (or italicized flavor text). Any abilities in the latter
//     section aren't chapter abilities and apply no matter how many lore counters are on the
//     creature.
//   [2025-06-06] Due to a rules change that takes effect with this release (see below for
//     details), a Saga that somehow loses all of its chapter abilities will not be sacrificed as a
//     state-based action. It will also not gain a lore counter at the beginning of each of its
//     controller's first main phases.
//   [2025-06-06] A chapter ability doesn't trigger if a lore counter is put on a Saga that already
//     had a number of lore counters greater than or equal to that chapter's number. For example,
//     the third lore counter put on a Saga causes the chapter III ability to trigger, but chapters
//     I and II won't trigger again.
//   [2025-06-06] If multiple chapter abilities trigger at the same time, their controller puts
//     them on the stack in any order. If any of them require targets, those targets are chosen as
//     you put the abilities on the stack, before any of those abilities resolve.
//   [2025-06-06] Removing lore counters won't cause a previous chapter ability to trigger. If lore
//     counters are removed from a Saga, the appropriate chapter abilities will trigger again when
//     the Saga receives more lore counters.
//
// Summon: Ixion's Saga-creature shape. Chapter I's Bird is Sidequest: Raise a
// Chocobo's token exactly (2/2 green Bird with the landfall pump).

const CHAPTER_I =
  "I — Wark — Create a 2/2 green Bird creature token with \"Whenever a land you control enters, this token gets +1/+0 until end of turn.\"";
const CHAPTER_II_IV = "II, III, IV — Kerplunk — Creatures you control gain trample until end of turn.";

export default defineCard({
  name: "Summon: Fat Chocobo",
  manaCost: "{4}{G}",
  colors: ["G"],
  types: ["enchantment", "creature"],
  subtypes: ["Saga", "Bird"],
  power: 4,
  toughness: 4,
  text: `(As this Saga enters and after your draw step, add a lore counter. Sacrifice after IV.)\n${CHAPTER_I}\n${CHAPTER_II_IV}`,
  chapters: [
    {
      at: [1],
      targets: [],
      effect: { kind: "create-token", token: "Chocobo Bird Token", count: 1 },
      resolve: null,
      text: CHAPTER_I,
    },
    {
      at: [2, 3, 4],
      targets: [],
      effect: {
        kind: "grant-keyword-all",
        filter: { type: "creature", controlledBy: "you" },
        keyword: "trample",
        duration: "end-of-turn",
      },
      resolve: null,
      text: CHAPTER_II_IV,
    },
  ],
});
