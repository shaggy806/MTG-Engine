import { defineCard } from "../define.js";
import { ward } from "../helpers.js";

// Top-commanders rank 81. "Three Autostubs" is a `deals-damage` trigger: a
// source you control other than Ghyrson dealing exactly 1 damage to one
// recipient, the amount *dealt* (after prevention and doubling — 2 prevented
// down to 1 is exactly 1, and 1 doubled to 2 is not). Once per recipient, so
// a Pyroclasm-for-1 fires it once per creature — a token stack once per token,
// each firing hitting one token of it. "That permanent or player"
// is the recipient itself, not a target: hexproof and ward don't stop it,
// and a permanent that has left the battlefield by then is dealt nothing.
// Ghyrson's own 2 damage can't retrigger it ("another source").
const AUTOSTUBS_TEXT =
  "Three Autostubs — Whenever another source you control deals exactly 1 damage to a " +
  "permanent or player, Ghyrson Starn deals 2 damage to that permanent or player.";

export default defineCard({
  name: "Ghyrson Starn, Kelermorph",
  manaCost: "{1}{U}{R}",
  colors: ["U", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Tyranid", "Human"],
  power: 3,
  toughness: 2,
  text: `Ward {2}\n${AUTOSTUBS_TEXT}`,
  triggered: [
    ward({ mana: "{2}" }),
    {
      trigger: { on: "deals-damage", who: "you-control", otherOnly: true, exactly: 1 },
      targets: [],
      effect: { kind: "damage", amount: 2, toTriggerRecipient: true },
      resolve: null,
      text: AUTOSTUBS_TEXT,
    },
  ],
});
