import { defineCard } from "../define.js";

// Top-commanders rank 204. "With flash or haste" is an `anyOf` over the two
// keywords, read off computed characteristics, so a creature granted haste
// counts and Sonic counts itself. The Treasure trigger is `dealt-damage` with
// that filter: once per creature per damage event, however many sources hit
// it at once (two blockers are one event), and damage that was prevented
// isn't dealt, so it makes nothing.
const FLASH_OR_HASTE = {
  type: "creature",
  controlledBy: "you",
  anyOf: [{ keyword: "flash" }, { keyword: "haste" }],
} as const;
const GOTTA_GO_FAST_TEXT =
  "Gotta Go Fast — Whenever Sonic the Hedgehog attacks, put a +1/+1 counter on each creature " +
  "you control with flash or haste.";
const TREASURE_TEXT =
  "Whenever a creature you control with flash or haste is dealt damage, create a tapped " +
  "Treasure token.";

export default defineCard({
  name: "Sonic the Hedgehog",
  manaCost: "{1}{U}{R}{W}",
  colors: ["U", "R", "W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Hedgehog", "Warrior"],
  power: 2,
  toughness: 4,
  keywords: ["haste"],
  text: `Haste\n${GOTTA_GO_FAST_TEXT}\n${TREASURE_TEXT}`,
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: { kind: "add-counter-all", filter: FLASH_OR_HASTE, counter: "+1/+1", amount: 1 },
      resolve: null,
      text: GOTTA_GO_FAST_TEXT,
    },
    {
      trigger: { on: "dealt-damage", who: "you-control", filter: FLASH_OR_HASTE },
      targets: [],
      effect: { kind: "create-token", token: "Treasure Token", count: 1, tapped: true },
      resolve: null,
      text: TREASURE_TEXT,
    },
  ],
});
