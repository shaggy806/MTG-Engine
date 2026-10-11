import { defineCard } from "../define.js";

const ENTER_TEXT = "When Cloud enters, attach up to one target Equipment you control to it.";
const ATTACK_TEXT =
  "Whenever Cloud attacks, draw a card for each equipped attacking creature you control. Then if Cloud has power 7 or greater, create two Treasure tokens.";

// The Equipment is the target; Cloud is "it", only while it's still the
// creature that entered (rule 400.7). The ruling's "can't target an
// Equipment that can't legally be attached to Cloud" isn't screened at
// targeting (Hammer of Nazahn's way): such an Equipment, rare (Cloud with
// protection from artifacts, an Equipment that's a creature), attaches to
// nothing (rule 701.3b) — the same board, short only of a "becomes the
// target" trigger on your own Equipment. The draw counts the equipped attackers
// as the ability resolves, Cloud among them if it's equipped; his power is
// checked after the draws, as it is then.
export default defineCard({
  name: "Cloud, Ex-SOLDIER",
  manaCost: "{2}{R}{G}{W}",
  colors: ["R", "G", "W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Soldier", "Mercenary"],
  power: 4,
  toughness: 4,
  keywords: ["haste"],
  text: `Haste\n${ENTER_TEXT}\n${ATTACK_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [{ kind: "optional", of: { kind: "permanent", whose: "you", filter: { subtype: "Equipment" } } }],
      effect: { kind: "attach", target: "source", attachment: 0 },
      resolve: null,
      text: ENTER_TEXT,
    },
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          {
            kind: "draw",
            amount: { countOf: { type: "creature", controlledBy: "you", attacking: true, equipped: true } },
          },
          {
            kind: "conditional",
            condition: { kind: "source", filter: { power: { op: "gte", n: 7 } } },
            then: { kind: "create-token", token: "Treasure Token", count: 2 },
          },
        ],
      },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
});
