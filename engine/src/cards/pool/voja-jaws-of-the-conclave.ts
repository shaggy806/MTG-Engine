import { defineCard } from "../define.js";
import { ward } from "../helpers.js";

// EDHREC commander rank 99. Every clause is existing vocabulary:
//
// - Ward {3} (rule 702.21) is the `ward` helper's triggered ability, the same
//   shape as Miirym, Sentinel Wyrm's ward {2}.
// - The attack trigger is one `sequence`, read top to bottom as printed. Both
//   counts are `countOf`s, so both are taken as the trigger *resolves* (rule
//   608.2h), not as Voja is declared an attacker: an Elf that arrives or dies
//   in between changes X. `add-counter-all` evaluates X once and then puts
//   that many on each creature, so the counters can't change their own X —
//   and it routes through `add-counter`, so Doubling Season still doubles
//   them (rule 614.1a). "Elves/Wolves you control" is any permanent with that
//   subtype, which is what `countOf` counts (a token stack counts once per
//   token in it). The Wolf count is read after the counters go on, and Voja
//   is a Wolf, so a lone Voja draws one.
const ATTACK_TEXT =
  "Whenever Voja attacks, put X +1/+1 counters on each creature you control, where X is the " +
  "number of Elves you control. Draw a card for each Wolf you control.";

export default defineCard({
  name: "Voja, Jaws of the Conclave",
  manaCost: "{2}{R}{G}{W}",
  colors: ["R", "G", "W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Wolf"],
  power: 5,
  toughness: 5,
  keywords: ["vigilance", "trample"],
  text: `Vigilance, trample, ward {3}\n${ATTACK_TEXT}`,
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          {
            kind: "add-counter-all",
            filter: { type: "creature", controlledBy: "you" },
            counter: "+1/+1",
            amount: { countOf: { subtype: "Elf", controlledBy: "you" } },
          },
          {
            kind: "draw",
            amount: { countOf: { subtype: "Wolf", controlledBy: "you" } },
          },
        ],
      },
      resolve: null,
      text: ATTACK_TEXT,
    },
    ward({ mana: "{3}" }),
  ],
});
