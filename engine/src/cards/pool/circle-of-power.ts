import { defineCard } from "../define.js";

const DRAW_TEXT =
  "You draw two cards and you lose 2 life. Create a 0/1 black Wizard creature token with \"Whenever you cast a noncreature spell, this token deals 1 damage to each opponent.\"";
const WIZARDS_TEXT = "Wizards you control get +1/+0 and gain lifelink until end of turn.";
const WIZARDS = { subtype: "Wizard", controlledBy: "you" } as const;

// The Wizards are the ones you control as it resolves — the token it just
// made among them; a Wizard arriving later gets nothing.
export default defineCard({
  name: "Circle of Power",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: `${DRAW_TEXT}\n${WIZARDS_TEXT}`,
  effect: {
    kind: "sequence",
    effects: [
      { kind: "draw", amount: 2 },
      { kind: "lose-life", amount: 2 },
      { kind: "create-token", token: "Wizard Token (Kuja)", count: 1 },
      { kind: "modify-pt-all", filter: WIZARDS, power: 1, toughness: 0, duration: "end-of-turn" },
      { kind: "grant-keyword-all", filter: WIZARDS, keyword: "lifelink", duration: "end-of-turn" },
    ],
  },
});
