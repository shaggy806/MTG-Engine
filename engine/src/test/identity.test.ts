import { describe, expect, it } from "vitest";

import { createDefaultRegistry, defineCard } from "../cards.js";
import { validateCommanderDeck } from "../deck-validation.js";
import { colorIdentityOf, identityString, withinIdentity } from "../identity.js";

const reg = createDefaultRegistry();
const id = (name: string): string => identityString(colorIdentityOf(reg.get(name)));

describe("colorIdentityOf (rule 903.4)", () => {
  it("reads the mana cost", () => {
    expect(id("Lightning Bolt")).toBe("R");
    expect(id("Atraxa, Praetors' Voice")).toBe("WUBG");
    expect(id("Bloodbraid Elf")).toBe("RG");
  });

  it("counts a hybrid pip's colours", () => {
    expect(id("Wilt-Leaf Cavaliers")).toBe("WG"); // {G/W}{G/W}{G/W}
  });

  it("reads mana symbols in rules / ability text, not just the cost", () => {
    expect(id("Forest")).toBe("G"); // colourless card, {T}: Add {G}
    expect(id("Doom Blade")).toBe("B"); // "nonblack" is not a symbol; {B} in cost
  });

  it("is colourless for a card with no coloured mana symbols anywhere", () => {
    expect(id("Sol Ring")).toBe("");
    expect(id("Command Tower")).toBe(""); // "any color" has no coloured pip
    expect(id("Chromatic Lantern")).toBe("");
  });

  it("withinIdentity checks containment", () => {
    const rg = colorIdentityOf(reg.get("Bloodbraid Elf"));
    expect(withinIdentity(colorIdentityOf(reg.get("Lightning Bolt")), rg)).toBe(true);
    expect(withinIdentity(colorIdentityOf(reg.get("Forest")), rg)).toBe(true);
    expect(withinIdentity(colorIdentityOf(reg.get("Doom Blade")), rg)).toBe(false); // B not in RG
    expect(withinIdentity(colorIdentityOf(reg.get("Sol Ring")), rg)).toBe(true); // colourless
  });
});

describe("a multi-face card's identity is every face's (rule 903.4d)", () => {
  // Esika, God of the Tree's shape: a green front, and a back face whose
  // text holds every colour's mana symbol.
  const FRONT = "Test Tree God";
  const BACK = "Test Prismatic Span";
  const DOUBLE = "Test Two-Faced Knight";
  const DOUBLE_BACK = "Test Knight's Shadow";
  const faced = createDefaultRegistry()
    .register(
      defineCard({
        name: FRONT,
        manaCost: "{1}{G}{G}",
        colors: ["G"],
        types: ["creature"],
        supertypes: ["legendary"],
        subtypes: ["God"],
        power: 1,
        toughness: 4,
        text: "Vigilance",
        faces: [FRONT, BACK],
      }),
    )
    .register(
      defineCard({
        name: BACK,
        manaCost: "{W}{U}{B}{R}{G}",
        colors: ["W", "U", "B", "R", "G"],
        types: ["enchantment"],
        supertypes: ["legendary"],
        text: "At the beginning of your upkeep, reveal cards from the top of your library.",
        faces: [FRONT, BACK],
      }),
    )
    .register(
      defineCard({
        name: DOUBLE,
        manaCost: "{1}{W}",
        colors: ["W"],
        types: ["creature"],
        subtypes: ["Human", "Knight"],
        power: 2,
        toughness: 2,
        text: "",
        faces: [DOUBLE, DOUBLE_BACK],
      }),
    )
    .register(
      defineCard({
        name: DOUBLE_BACK,
        manaCost: null,
        colors: ["B"],
        types: ["creature"],
        subtypes: ["Vampire", "Knight"],
        power: 3,
        toughness: 3,
        text: "",
        faces: [DOUBLE, DOUBLE_BACK],
      }),
    );

  it("reads the back face through a lookup, and only the given face without one", () => {
    expect(identityString(colorIdentityOf(faced.get(FRONT), faced))).toBe("WUBRG");
    expect(identityString(colorIdentityOf(faced.get(FRONT)))).toBe("G");
    // A colour indicator on the back face counts too.
    expect(identityString(colorIdentityOf(faced.get(DOUBLE), faced))).toBe("WB");
  });

  it("deck validation: the commander's back face widens its identity, a card's narrows the deck", () => {
    const deck = (commander: string, cards: readonly string[]) =>
      validateCommanderDeck({ commanders: [commander], cards, size: 1 + cards.length }, faced);
    // Lightning Bolt is inside the tree god's identity only by its back face.
    expect(deck(FRONT, ["Lightning Bolt"]).violations).toEqual([]);
    // A white-and-black double-faced card doesn't fit a white-only deck.
    const r = deck("Thalia, Guardian of Thraben", [DOUBLE]);
    expect(r.violations.some((v) => v.includes(DOUBLE) && v.includes("colour identity"))).toBe(true);
  });
});
