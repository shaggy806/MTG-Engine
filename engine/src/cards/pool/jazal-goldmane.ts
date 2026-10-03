import { defineCard } from "../define.js";

// X counts every attacking creature, whoever controls it, and is read once as
// the ability resolves (rule 608.2h): an attacker removed afterwards doesn't
// shrink the bonus.
const PUMP_TEXT =
  "{3}{W}{W}: Attacking creatures you control get +X/+X until end of turn, where X is the number of attacking creatures.";

export default defineCard({
  name: "Jazal Goldmane",
  manaCost: "{2}{W}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Cat", "Warrior"],
  power: 4,
  toughness: 4,
  keywords: ["first-strike"],
  text: `First strike (This creature deals combat damage before creatures without first strike.)\n${PUMP_TEXT}`,
  activated: [
    {
      cost: { mana: "{3}{W}{W}", tap: false },
      targets: [],
      effect: {
        kind: "modify-pt-all",
        filter: { type: "creature", attacking: true, controlledBy: "you" },
        power: { countOf: { type: "creature", attacking: true } },
        toughness: { countOf: { type: "creature", attacking: true } },
        duration: "end-of-turn",
      },
      resolve: null,
      text: PUMP_TEXT,
    },
  ],
});
