import { defineCard } from "../define.js";
import type { EffectSpec } from "../../effects.js";

// EDHREC rank 5335. Belladonna Took's shape: a fourth resolution and every
// one after it does nothing. Eerie is one ability with two trigger events,
// so both entries count toward the same "this ability has resolved this
// turn" (`sameAbilityAs`).
const EERIE =
  "Eerie — Whenever an enchantment you control enters and whenever you fully unlock a Room, surveil 2 if this is the first time this ability has resolved this turn. If it's the second time, each opponent discards a card. If it's the third time, put a creature card from a graveyard onto the battlefield under your control.";
const EFFECT: EffectSpec = {
  kind: "sequence",
  effects: [
    { kind: "conditional", condition: { kind: "resolved-this-turn", n: 1 }, then: { kind: "surveil", amount: 2 } },
    {
      kind: "conditional",
      condition: { kind: "resolved-this-turn", n: 2 },
      then: { kind: "discard", target: "each-opponent", amount: 1 },
    },
    {
      kind: "conditional",
      condition: { kind: "resolved-this-turn", n: 3 },
      then: {
        kind: "look-and-choose",
        zone: "graveyards",
        min: 1,
        max: 1,
        destination: "battlefield",
        leftover: "stay",
        filter: { type: "creature" },
      },
    },
  ],
};

export default defineCard({
  name: "Victor, Valgavoth's Seneschal",
  manaCost: "{1}{W}{B}",
  colors: ["W", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Warlock"],
  power: 3,
  toughness: 3,
  text: EERIE,
  triggered: [
    { trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "enchantment" } }, targets: [], effect: EFFECT, resolve: null, text: EERIE },
    { trigger: { on: "door-unlocked", who: "you-control", fully: true }, sameAbilityAs: 0, targets: [], effect: EFFECT, resolve: null, text: EERIE },
  ],
});
