import { defineCard } from "../define.js";

// All three last for as long as this Dragon stays on the battlefield,
// whoever controls it and whatever abilities it has, and none of it happens
// if it's gone before the ability resolves (rule 611.2b — the rulings). The
// permanent stays without abilities, unable to attack or block, if someone
// else takes it meanwhile; and as the Dragon dies, the abilities it took away
// don't trigger on that death (rule 603.10a — the ruling).
const TEXT =
  "When this creature enters, choose target Human or artifact an opponent controls. For as long as this creature remains on the battlefield, gain control of that permanent, it loses all abilities, and it can't attack or block.";

export default defineCard({
  name: "Opportunistic Dragon",
  manaCost: "{2}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 4,
  toughness: 3,
  keywords: ["flying"],
  text: `Flying\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [
        {
          kind: "permanent",
          filter: { anyOf: [{ subtype: "Human" }, { type: "artifact" }], controlledBy: "opponent" },
        },
      ],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "gain-control", target: 0, untilEndOfTurn: false, whileSource: true },
          { kind: "lose-abilities", target: 0, duration: "while-source" },
          { kind: "restrict", target: 0, restrictions: ["cant-attack", "cant-block"], duration: "while-source" },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
