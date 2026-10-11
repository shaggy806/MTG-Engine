import { defineCard } from "../define.js";

// EDHREC rank 6704.
//
// Rulings:
//   - A creature token you control that's enchanted or equipped gets only
//     +1/+1, however many Auras and Equipment are attached to it.
//   - It's enchanted or equipped if an Aura or Equipment is attached to it;
//     you needn't control that Aura or Equipment.
//
// The dies trigger is Liesa's ("another nontoken creature you control") with
// Halvar's "enchanted or equipped" clause. The creature that died is matched
// as it last existed on the battlefield (rule 603.10a), whose snapshot keeps
// what was attached to it (`LastKnownInfo.equipped`/`enchanted`) — its Auras
// are only put into the graveyard afterwards, as a state-based action. The
// intervening "if" (rule 603.4) asks about that past moment, so it reads the
// same as the trigger resolves. "Return it" is the card in the graveyard
// (Sword of the Realms); once it has left there, it's a new object and
// nothing happens (rule 400.7).
const DIES_TEXT =
  "Whenever another nontoken creature you control dies, if it was enchanted or equipped, return it to its owner's hand.";
const ANTHEM_TEXT = "Creature tokens you control that are enchanted or equipped get +1/+1.";

export default defineCard({
  name: "Koll, the Forgemaster",
  manaCost: "{R}{W}",
  colors: ["R", "W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Dwarf", "Warrior"],
  power: 2,
  toughness: 2,
  text: `${DIES_TEXT}\n${ANTHEM_TEXT}`,
  triggered: [
    {
      trigger: {
        on: "dies",
        who: "you-control",
        otherOnly: true,
        filter: { type: "creature", token: false, anyOf: [{ enchanted: true }, { equipped: true }] },
      },
      targets: [],
      effect: { kind: "return-to-hand", target: "trigger-object", from: "graveyard" },
      resolve: null,
      text: DIES_TEXT,
    },
  ],
  static: [
    {
      affects: {
        scope: "filter",
        filter: { type: "creature", controlledBy: "you", token: true, anyOf: [{ enchanted: true }, { equipped: true }] },
      },
      grantPt: [1, 1],
      text: ANTHEM_TEXT,
    },
  ],
});
