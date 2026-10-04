import { defineCard } from "../define.js";

// EDHREC rank 4678.
//
// Rulings:
//   [2018-04-27] Once a chapter ability has triggered, the ability on the stack won’t be affected
//     if the Saga gains or loses counters, or if it leaves the battlefield.
//   [2018-04-27] Each of Song of Freyalise’s chapter abilities affects only creatures you control
//     at the time it resolves. Creatures you begin to control later in the turn won’t gain
//     abilities or get a +1/+1 counter.
//   [2018-04-27] If counters are removed from a Saga, the appropriate chapter abilities will
//     trigger again when the Saga receives lore counters. Removing lore counters won’t cause a
//     previous chapter ability to trigger.
//   [2018-04-27] As a Saga enters the battlefield, its controller puts a lore counter on it. As
//     your precombat main phase begins (immediately after your draw step), you put another lore
//     counter on each Saga you control. Putting a lore counter on a Saga in either of these ways
//     doesn’t use the stack.
//   [2018-04-27] Once the number of lore counters on a Saga is greater than or equal to the
//     greatest number among its chapter abilities—in the Dominaria set, this is always three—the
//     Saga’s controller sacrifices it as soon as its chapter ability has left the stack, most
//     likely by resolving or being countered. This state-based action doesn’t use the stack.
//   [2018-04-27] If multiple chapter abilities trigger at the same time, their controller puts
//     them on the stack in any order. If any of them require targets, those targets are chosen as
//     you put the abilities on the stack, before any of those abilities resolve.
//   [2018-04-27] A chapter ability doesn’t trigger if a lore counter is put on a Saga that already
//     had a number of lore counters greater than or equal to that chapter’s number. For example,
//     the third lore counter put on a Saga causes the III chapter ability to trigger, but I and II
//     won’t trigger again.
//   [2018-04-27] Each symbol on the left of a Saga’s text box represents a chapter ability. A
//     chapter ability is a triggered ability that triggers when a lore counter that is put on the
//     Saga causes the number of lore counters on the Saga to become equal to or greater than the
//     ability’s chapter number. Chapter abilities are put onto the stack and may be responded to.

// Each chapter reaches only the creatures you control as it resolves (the
// ruling): `grant-activated-all` and the `-all` effects fix their matches then
// (rule 611.2c). "Those creatures" in III are the same set the counters went
// on — every step reads the one battlefield within one resolution.
const YOURS = { type: "creature", controlledBy: "you" } as const;
const MANA_TEXT = "{T}: Add one mana of any color.";

export default defineCard({
  name: "Song of Freyalise",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["enchantment"],
  subtypes: ["Saga"],
  text: "(As this Saga enters and after your draw step, add a lore counter. Sacrifice after III.)\nI, II — Until your next turn, creatures you control gain \"{T}: Add one mana of any color.\"\nIII — Put a +1/+1 counter on each creature you control. Those creatures gain vigilance, trample, and indestructible until end of turn.",
  chapters: [
    {
      at: [1, 2],
      targets: [],
      effect: {
        kind: "grant-activated-all",
        filter: YOURS,
        ability: {
          cost: { mana: null, tap: true },
          targets: [],
          effect: { kind: "add-mana", mana: "any-color", amount: 1 },
          resolve: null,
          text: MANA_TEXT,
        },
        duration: "until-your-next-turn",
      },
      resolve: null,
      text: "I, II — Until your next turn, creatures you control gain \"{T}: Add one mana of any color.\"",
    },
    {
      at: [3],
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "add-counter-all", filter: YOURS, counter: "+1/+1", amount: 1 },
          { kind: "grant-keyword-all", filter: YOURS, keyword: "vigilance", duration: "end-of-turn" },
          { kind: "grant-keyword-all", filter: YOURS, keyword: "trample", duration: "end-of-turn" },
          { kind: "grant-keyword-all", filter: YOURS, keyword: "indestructible", duration: "end-of-turn" },
        ],
      },
      resolve: null,
      text: "III — Put a +1/+1 counter on each creature you control. Those creatures gain vigilance, trample, and indestructible until end of turn.",
    },
  ],
});
