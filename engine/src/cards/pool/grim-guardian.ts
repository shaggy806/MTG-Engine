import { defineCard } from "../define.js";
import type { EffectSpec } from "../../effects.js";

// EDHREC rank 3283.
//
// Rulings:
//   [2014-04-26] A constellation ability triggers whenever an enchantment enters the battlefield
//     under your control for any reason. Enchantments with other card types, such as enchantment
//     creatures, will also cause constellation abilities to trigger.
//   [2014-04-26] When an enchantment enters the battlefield under your control, each constellation
//     ability of permanents you control will trigger. You can put these abilities on the stack in
//     any order. The last ability you put on the stack will be the first one that resolves.
//   [2014-04-26] An Aura spell without bestow that has an illegal target when it tries to resolve
//     won't resolve and will be put into its owner's graveyard. It won't enter the battlefield and
//     constellation abilities won't trigger. An Aura spell with bestow won't be countered this
//     way. It will revert to being an enchantment creature and resolve, entering the battlefield
//     and triggering constellation abilities.

const TEXT =
  "Constellation — Whenever this creature or another enchantment you control enters, each opponent loses 1 life.";
const DRAIN: EffectSpec = { kind: "lose-life", amount: 1, who: "each-opponent" };

// Doomwake Giant's two-trigger constellation: itself, and each other
// enchantment you control.
export default defineCard({
  name: "Grim Guardian",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["enchantment", "creature"],
  subtypes: ["Zombie"],
  power: 1,
  toughness: 4,
  text: TEXT,
  triggered: [
    { trigger: { on: "enters-battlefield", who: "self" }, targets: [], effect: DRAIN, resolve: null, text: TEXT },
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "enchantment" }, otherOnly: true },
      targets: [],
      effect: DRAIN,
      resolve: null,
      text: TEXT,
    },
  ],
});
