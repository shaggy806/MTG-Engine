import { defineCard } from "../define.js";
import { manaTapAbility } from "../helpers.js";

/** Amonkhet. Eternalize {2}{G}{G} (rule 702.129 — exile from graveyard as a
 * sorcery to create a 4/4 black Zombie Snake Druid copy with no mana cost)
 * isn't modeled: it's a wholly separate alt-cast-as-a-token-from-graveyard
 * mechanic, distinct from flashback/escape/disturb (needed-cards P19). Both
 * mana abilities are faithful; the Ferocious one is gated by the new
 * `ActivatedAbility.condition` (needed-cards P19), so it's simply
 * unavailable — not just always-on — until its condition is met. */
export default defineCard({
  name: "Fanatic of Rhonas",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Snake", "Druid"],
  power: 1,
  toughness: 4,
  text:
    "{T}: Add {G}.\n" +
    "Ferocious — {T}: Add {G}{G}{G}{G}. Activate only if you control a creature with power 4 or greater.",
  activated: [
    manaTapAbility("G"),
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "G", amount: 4 },
      resolve: null,
      condition: {
        kind: "controls",
        filter: { type: "creature", power: { op: "gte", n: 4 } },
        atLeast: 1,
      },
      text: "Ferocious — {T}: Add {G}{G}{G}{G}. Activate only if you control a creature with power 4 or greater.",
    },
  ],
});
