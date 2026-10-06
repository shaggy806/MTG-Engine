import { defineCard } from "../define.js";

// EDHREC rank 6471.
//
// Rulings:
//   [2017-08-25] The opponent who creates the Rat token is the owner of that token.
//   [2017-08-25] Hungry Lynx's last ability puts a +1/+1 counter on each Cat you control,
//     including itself.
//   [2017-08-25] If Hungry Lynx dies at the same time as a Rat, its ability triggers, but Hungry
//     Lynx won't be on the battlefield as that ability resolves.
//   [2017-08-25] Tokens that are sacrificed or destroyed are put into their owner's graveyard
//     before ceasing to exist. If the token was a Rat, Hungry Lynx's last ability will trigger.
//
// Protection from a subtype is Feline Sovereign's filter; the opponent makes
// the token (Hunted Horror's `who: "target-controller"`). Any Rat dying, any
// player's.
const PROTECTION_TEXT = "Cats you control have protection from Rats.";
const END_TEXT = "At the beginning of your end step, target opponent creates a 1/1 black Rat creature token with deathtouch.";
const DIES_TEXT = "Whenever a Rat dies, put a +1/+1 counter on each Cat you control.";

export default defineCard({
  name: "Hungry Lynx",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Cat"],
  power: 2,
  toughness: 2,
  text: `${PROTECTION_TEXT} (They can't be blocked, targeted, or dealt damage by Rats.)\n${END_TEXT}\n${DIES_TEXT}`,
  static: [
    {
      affects: { scope: "creatures-you-control", subtype: "Cat" },
      protection: { filter: { subtype: "Rat" } },
      text: PROTECTION_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      targets: ["opponent"],
      effect: { kind: "create-token", token: "Deathtouch Rat Token", count: 1, who: "target-controller" },
      resolve: null,
      text: END_TEXT,
    },
    {
      trigger: { on: "dies", who: "any", filter: { subtype: "Rat" } },
      targets: [],
      effect: {
        kind: "add-counter-all",
        filter: { type: "creature", subtype: "Cat", controlledBy: "you" },
        counter: "+1/+1",
        amount: 1,
      },
      resolve: null,
      text: DIES_TEXT,
    },
  ],
});
