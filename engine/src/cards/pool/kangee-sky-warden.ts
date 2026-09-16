import { defineCard } from "../define.js";

export default defineCard({
  name: "Kangee, Sky Warden",
  manaCost: "{3}{W}{U}",
  colors: ["W", "U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Bird", "Wizard"],
  power: 3,
  toughness: 3,
  keywords: ["flying", "vigilance"],
  text:
    "Flying, vigilance\n" +
    "Whenever Kangee, Sky Warden attacks, attacking creatures with flying get " +
    "+2/+0 until end of turn.\n" +
    "Whenever Kangee, Sky Warden blocks, blocking creatures with flying get " +
    "+0/+2 until end of turn.",
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: {
        // "**Attacking** creatures", unqualified — anyone's, though in
        // practice only the active player has any.
        kind: "modify-pt-all",
        filter: { type: "creature", keyword: "flying", attacking: true },
        power: 2,
        toughness: 0,
        duration: "end-of-turn",
      },
      resolve: null,
      text:
        "Whenever Kangee, Sky Warden attacks, attacking creatures with flying get " +
        "+2/+0 until end of turn.",
    },
    {
      trigger: { on: "blocks", who: "self" },
      targets: [],
      effect: {
        kind: "modify-pt-all",
        filter: { type: "creature", keyword: "flying", blocking: true },
        power: 0,
        toughness: 2,
        duration: "end-of-turn",
      },
      resolve: null,
      text:
        "Whenever Kangee, Sky Warden blocks, blocking creatures with flying get " +
        "+0/+2 until end of turn.",
    },
  ],
});
