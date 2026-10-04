import { defineCard } from "../define.js";

// EDHREC rank 5538.
//
// Two layer-7d counts (Skycat Sovereign's `excludeSelf` for "other", Fiend
// Artisan's graveyard count); the surveil reads the combat damage dealt as
// the trigger's value (Cold-Eyed Selkie).

const PT_TEXT =
  "Desmond Miles gets +1/+0 for each other Assassin you control and each Assassin card in your graveyard.";
const SURVEIL_TEXT =
  "Whenever Desmond Miles deals combat damage to a player, surveil X, where X is the amount of damage it dealt to that player.";

export default defineCard({
  name: "Desmond Miles",
  manaCost: "{1}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Assassin"],
  power: 1,
  toughness: 3,
  keywords: ["menace"],
  text: `Menace\n${PT_TEXT}\n${SURVEIL_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      grantPtPerCount: { filter: { subtype: "Assassin", controlledBy: "you" }, excludeSelf: true, pt: [1, 0] },
      text: PT_TEXT,
    },
    {
      affects: { scope: "self" },
      grantPtPerCount: { inGraveyard: { subtype: "Assassin", ownedBy: "you" }, pt: [1, 0] },
      text: PT_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [],
      effect: { kind: "surveil", amount: { triggerValue: true } },
      resolve: null,
      text: SURVEIL_TEXT,
    },
  ],
});
