import { defineCard } from "../define.js";
import { eternalizeAbility, manaTapAbility } from "../helpers.js";

/** Amonkhet. The Ferocious ability is gated by `ActivatedAbility.condition`
 * (needed-cards P19), so it's simply unavailable until its condition is met.
 * Eternalize (rule 702.129) is `eternalizeAbility`. */
const ETERNALIZE_TEXT =
  "Eternalize {2}{G}{G} ({2}{G}{G}, Exile this card from your graveyard: Create a token that's a " +
  "copy of it, except it's a 4/4 black Zombie Snake Druid with no mana cost. Eternalize only as a " +
  "sorcery.)";

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
    "Ferocious — {T}: Add {G}{G}{G}{G}. Activate only if you control a creature with power 4 or greater.\n" +
    ETERNALIZE_TEXT,
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
    eternalizeAbility("{2}{G}{G}", ETERNALIZE_TEXT),
  ],
});
