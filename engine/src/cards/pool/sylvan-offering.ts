import { defineCard } from "../define.js";

// EDHREC rank 4774.
// Makes Treefolk → "Treefolk Token (Sylvan Offering)" (an X/X: its base P/T set as it's made).
// Makes Elf Warrior → "Elf Warrior Token".
//
// Rulings:
//   [2014-11-07] You choose the opponents for each effect as the spell resolves.
//   [2014-11-07] You may choose the same opponent for each of the effects, or you may choose
//     different opponents. None of the affected players are targets of the spell.

const TREEFOLK_TEXT = "Choose an opponent. You and that player each create an X/X green Treefolk creature token.";
const ELVES_TEXT = "Choose an opponent. You and that player each create X 1/1 green Elf Warrior creature tokens.";
const X_BY_X = { power: "x", toughness: "x" } as const;

export default defineCard({
  name: "Sylvan Offering",
  manaCost: "{X}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: `${TREEFOLK_TEXT}\n${ELVES_TEXT}`,
  effect: {
    kind: "sequence",
    effects: [
      // Each sentence chooses its own opponent as the spell resolves (not a
      // target), and "you and that player each create" is one event.
      {
        kind: "choose-opponent",
        then: {
          kind: "sequence",
          simultaneous: true,
          effects: [
            { kind: "create-token", token: "Treefolk Token (Sylvan Offering)", count: 1, basePt: X_BY_X },
            { kind: "create-token", token: "Treefolk Token (Sylvan Offering)", count: 1, basePt: X_BY_X, who: "that-player" },
          ],
        },
      },
      {
        kind: "choose-opponent",
        then: {
          kind: "sequence",
          simultaneous: true,
          effects: [
            { kind: "create-token", token: "Elf Warrior Token", count: "x" },
            { kind: "create-token", token: "Elf Warrior Token", count: "x", who: "that-player" },
          ],
        },
      },
    ],
  },
});
