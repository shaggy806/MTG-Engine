import { defineCard } from "../define.js";
import { equip } from "../helpers.js";

const DAMAGE_TEXT =
  "Whenever equipped creature deals combat damage to a player, put a +1/+1 counter on a creature you control, then proliferate.";

// "A creature you control" isn't targeted: it's chosen as the ability
// resolves, and the proliferate after it can pick that creature again.
export default defineCard({
  name: "Sword of Truth and Justice",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text:
    "Equipped creature gets +2/+2 and has protection from white and from blue.\n" +
    `${DAMAGE_TEXT} (Choose any number of permanents and/or players, then give each another counter of each kind already there.)\n` +
    "Equip {2}",
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [2, 2],
      protection: { colors: ["W", "U"] },
      text: "Equipped creature gets +2/+2 and has protection from white and from blue.",
    },
  ],
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "attached" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          {
            kind: "choose-permanents",
            filter: { type: "creature", controlledBy: "you" },
            min: 1,
            upTo: 1,
            prompt: "Choose a creature you control to put a +1/+1 counter on",
            then: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
          },
          { kind: "proliferate" },
        ],
      },
      resolve: null,
      text: DAMAGE_TEXT,
    },
  ],
  activated: [equip("{2}")],
});
