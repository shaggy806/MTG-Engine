import { defineCard } from "../define.js";

// EDHREC rank 5081.
//
// Rulings:
//   [2023-06-16] If the target of Arwen's second ability is illegal as it tries to resolve, the
//     ability does nothing. You won't get to put any counters on Arwen.
//   [2023-06-16] You remove the indestructible counter from Arwen as a cost to activate its second
//     ability. If Arwen already received 2 damage earlier in the turn, it will be destroyed due to
//     having lethal damage before you get to put a +1/+1 counter on it.

const ENTERS_TEXT = "Arwen enters with an indestructible counter on her.";
const GIFT_TEXT =
  "{1}, Remove an indestructible counter from Arwen: Another target creature gains indestructible until end of turn. Put a +1/+1 counter and a lifelink counter on that creature and a +1/+1 counter and a lifelink counter on Arwen.";

// The ability's only target: illegal on resolution, the whole ability does
// nothing, Arwen's counters included (the ruling).
export default defineCard({
  name: "Arwen, Mortal Queen",
  manaCost: "{1}{G}{W}",
  colors: ["W", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elf", "Noble"],
  power: 2,
  toughness: 2,
  text: `${ENTERS_TEXT}\n${GIFT_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", counters: { kind: "indestructible", amount: 1 } },
      text: ENTERS_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{1}", tap: false, removeCounter: { kind: "indestructible", count: 1 } },
      targets: [{ kind: "other", of: "creature" }],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "grant-keyword", target: 0, keyword: "indestructible", duration: "end-of-turn" },
          { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
          { kind: "add-counter", target: 0, counter: "lifelink", amount: 1 },
          { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
          { kind: "add-counter", target: "source", counter: "lifelink", amount: 1 },
        ],
      },
      resolve: null,
      text: GIFT_TEXT,
    },
  ],
});
