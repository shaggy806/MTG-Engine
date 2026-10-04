import { defineCard } from "../define.js";

// EDHREC rank 6241.
//
// Rulings:
//   [2022-04-29] If you choose the first mode and your creature is not a legal target as Brokers
//     Charm resolves, no damage will be dealt.
//   [2022-04-29] You can't choose the first mode for Brokers Charm unless your opponent has a
//     creature or planeswalker to target.
//   [2022-04-29] If you choose the first mode and your opponent's creature or planeswalker is not
//     a legal target as Brokers Charm resolves, your creature will still get +1/+0

// Mode one is Ancient Animus's shape: an illegal target's slot is blank as
// the spell resolves (rule 608.2b), so the pump still lands on a legal
// creature of yours while the one-sided fight needs both slots.
export default defineCard({
  name: "Brokers Charm",
  manaCost: "{G}{W}{U}",
  colors: ["W", "U", "G"],
  types: ["instant"],
  text:
    "Choose one —\n" +
    "• Target creature you control gets +1/+0 until end of turn. It deals damage equal to its power to target creature or planeswalker an opponent controls.\n" +
    "• Destroy target enchantment.\n" +
    "• Draw two cards.",
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        text: "Target creature you control gets +1/+0 until end of turn. It deals damage equal to its power to target creature or planeswalker an opponent controls.",
        targets: [
          "creature-you-control",
          { kind: "permanent", whose: "opponent", filter: { typesAnyOf: ["creature", "planeswalker"] } },
        ],
        effect: {
          kind: "sequence",
          effects: [
            { kind: "modify-pt", target: 0, power: 1, toughness: 0, duration: "end-of-turn" },
            { kind: "fight", a: 0, b: 1, oneSided: true },
          ],
        },
      },
      {
        text: "Destroy target enchantment.",
        targets: ["enchantment"],
        effect: { kind: "destroy", target: 0 },
      },
      {
        text: "Draw two cards.",
        targets: [],
        effect: { kind: "draw", amount: 2 },
      },
    ],
  },
});
