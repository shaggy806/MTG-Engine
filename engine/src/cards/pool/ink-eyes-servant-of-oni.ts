import { defineCard } from "../define.js";
import { ninjutsu, ninjutsuText } from "../helpers.js";

// EDHREC rank 2923.
const HIT =
  "Whenever Ink-Eyes deals combat damage to a player, you may put target creature card from that player's graveyard onto the battlefield under your control.";
const REGENERATE = "{1}{B}: Regenerate Ink-Eyes.";

export default defineCard({
  name: "Ink-Eyes, Servant of Oni",
  manaCost: "{4}{B}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Rat", "Ninja"],
  power: 5,
  toughness: 4,
  text: `${ninjutsuText("{3}{B}{B}")}\n${HIT}\n${REGENERATE}`,
  activated: [
    ninjutsu("{3}{B}{B}"),
    {
      cost: { mana: "{1}{B}", tap: false },
      targets: [],
      effect: { kind: "regenerate", target: "source" },
      resolve: null,
      text: REGENERATE,
    },
  ],
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [{ kind: "card-in-graveyard", whose: "trigger-player", filter: { type: "creature" } }],
      effect: {
        kind: "may",
        prompt: "Put target creature card onto the battlefield under your control?",
        effect: { kind: "put-onto-battlefield", target: 0, underYourControl: true },
      },
      resolve: null,
      text: HIT,
    },
  ],
});
