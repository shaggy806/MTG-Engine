import { defineCard } from "../define.js";

// #143 in top-commanders.txt.
//
// Stagger is a player effect of Lightning's controller that lasts until
// their next turn: damage from any source to that player, or to a permanent
// that player controls, is doubled. The player is fixed as it resolves.
const STAGGER_TEXT =
  "Stagger — Whenever Lightning deals combat damage to a player, until your next turn, if a " +
  "source would deal damage to that player or a permanent that player controls, it deals double " +
  "that damage instead.";

export default defineCard({
  name: "Lightning, Army of One",
  manaCost: "{1}{R}{W}",
  colors: ["R", "W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 3,
  toughness: 2,
  keywords: ["first-strike", "trample", "lifelink"],
  text: `First strike, trample, lifelink\n${STAGGER_TEXT}`,
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [],
      effect: {
        kind: "player-effect",
        duration: "until-your-next-turn",
        damageTo: { who: "trigger-player", multiplier: 2, permanentsToo: true },
      },
      resolve: null,
      text: STAGGER_TEXT,
    },
  ],
});
