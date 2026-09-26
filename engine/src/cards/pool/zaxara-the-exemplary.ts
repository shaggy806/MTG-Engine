import { addManaAbility } from "../helpers.js";
import { defineCard } from "../define.js";

// #79 in top-commanders.txt.
//
// X is the X of the spell cast: a cast trigger reads it as the spell is cast,
// so a countered spell still gives its Hydra. The counters are *put* on the
// Hydra once it has entered, not ones it enters with, and state-based
// actions don't see the 0/0 until they're on. With X = 0 it dies.
const HYDRA_TEXT =
  "Whenever you cast a spell with {X} in its mana cost, create a 0/0 green Hydra creature token, then put X +1/+1 " +
  "counters on it.";

export default defineCard({
  name: "Zaxara, the Exemplary",
  manaCost: "{1}{B}{G}{U}",
  colors: ["B", "G", "U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Nightmare", "Hydra"],
  power: 2,
  toughness: 3,
  keywords: ["deathtouch"],
  text: `Deathtouch\n{T}: Add two mana of any one color.\n${HYDRA_TEXT}`,
  activated: [addManaAbility({ mana: "any-color", amount: 2, text: "{T}: Add two mana of any one color." })],
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { xInManaCost: true } },
      targets: [],
      effect: {
        kind: "create-token",
        token: "Hydra Token",
        count: 1,
        thenCounters: { kind: "+1/+1", amount: "x" },
      },
      resolve: null,
      text: HYDRA_TEXT,
    },
  ],
});
