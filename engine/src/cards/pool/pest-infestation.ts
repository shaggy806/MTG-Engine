import { defineCard } from "../define.js";

const TEXT =
  "Destroy up to X target artifacts and/or enchantments. Create twice X 1/1 black and green Pest creature " +
  'tokens with "When this token dies, you gain 1 life."';

// Up to X targets, X chosen first (rule 601.2b–c): an "any number of" group
// capped at X (`max: "x"`). The Pests are twice the X chosen, however many
// were destroyed — but none if every target chosen is illegal as it
// resolves (the rulings: the spell doesn't resolve).
export default defineCard({
  name: "Pest Infestation",
  manaCost: "{X}{X}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: TEXT,
  targets: [{ kind: "any-number", of: "artifact-or-enchantment", max: "x" }],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "for-each-target", from: 0, effect: { kind: "destroy", target: 0 }, simultaneous: true },
      { kind: "create-token", token: "Pest Token", count: { product: [2, "x"] } },
    ],
  },
});
