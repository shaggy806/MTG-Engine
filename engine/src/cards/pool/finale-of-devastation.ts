import type { EffectSpec, SearchZones } from "../../effects.js";
import { defineCard } from "../define.js";

/** needed-cards P10. "Your library and/or graveyard" is the player's choice
 * of zones, made as it resolves: a `modal` over the three `search-library`
 * `zones`, where only a search that includes the library shuffles. The pump
 * waits for the find, so the creature it puts onto the battlefield gets
 * +X/+X and haste too (the ruling) — and happens whether or not anything
 * was found. */
const search = (zones: SearchZones): EffectSpec => ({
  kind: "search-library",
  filter: { type: "creature", manaValue: { op: "lte", n: "x" } },
  destination: "battlefield",
  min: 0,
  max: 1,
  zones,
});

const YOURS = { type: "creature", controlledBy: "you" } as const;

export default defineCard({
  name: "Finale of Devastation",
  manaCost: "{X}{G}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text:
    "Search your library and/or graveyard for a creature card with mana value X or less and put " +
    "it onto the battlefield. If you search your library this way, shuffle. If X is 10 or more, " +
    "creatures you control get +X/+X and gain haste until end of turn.",
  effect: {
    kind: "sequence",
    effects: [
      {
        kind: "modal",
        minModes: 1,
        maxModes: 1,
        modes: [
          { text: "Search your library and graveyard", effect: search("library-and-graveyard") },
          { text: "Search your library", effect: search("library") },
          { text: "Search your graveyard", effect: search("graveyard") },
        ],
      },
      {
        kind: "conditional",
        condition: { kind: "x", compare: { op: "gte", n: 10 } },
        then: {
          kind: "sequence",
          effects: [
            { kind: "modify-pt-all", filter: YOURS, power: "x", toughness: "x", duration: "end-of-turn" },
            { kind: "grant-keyword-all", filter: YOURS, keyword: "haste", duration: "end-of-turn" },
          ],
        },
      },
    ],
  },
});
