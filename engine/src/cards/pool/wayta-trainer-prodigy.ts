import { defineCard } from "../define.js";

// #427 in top-commanders.txt.
//
// "This ability costs {2} less to activate if it targets two creatures you
// control" splits the one printed ability into the two target cases it can
// have, each at the cost it actually costs: your creature and an opponent's
// at {2}{G}, and two of yours at {G}. Every legal choice of targets is
// exactly one of them, so nothing can be activated at a cost the card
// wouldn't charge.
const FIGHT_TEXT =
  "{2}{G}, {T}: Target creature you control fights another target creature. This ability costs {2} " +
  "less to activate if it targets two creatures you control.";
const DOUBLE_TEXT =
  "If a creature you control being dealt damage causes a triggered ability of a permanent you control " +
  "to trigger, that ability triggers an additional time.";

export default defineCard({
  name: "Wayta, Trainer Prodigy",
  manaCost: "{R}{G}{W}",
  colors: ["R", "G", "W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Warrior"],
  power: 1,
  toughness: 5,
  keywords: ["haste"],
  text: `Haste\n${FIGHT_TEXT}\n${DOUBLE_TEXT}`,
  activated: [
    {
      cost: { mana: "{2}{G}", tap: true },
      targets: ["creature-you-control", "creature-an-opponent-controls"],
      effect: { kind: "fight", a: 0, b: 1 },
      resolve: null,
      text: FIGHT_TEXT,
    },
    {
      cost: { mana: "{G}", tap: true },
      targets: ["creature-you-control", { kind: "other", of: "creature-you-control", than: { slot: 0 } }],
      effect: { kind: "fight", a: 0, b: 1 },
      resolve: null,
      text: FIGHT_TEXT,
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      doubleTriggers: { cause: "dealt-damage", filter: { type: "creature", controlledBy: "you" } },
      text: DOUBLE_TEXT,
    },
  ],
});
