# Figma cleanup — prompts for the Figma AI agent

File: `FqZJJjZaxz6Hc4V9FdEwV3` ("Polari"), Mockups page.

Paste one prompt at a time into Figma's AI agent, then paste its reply back into
the Claude Code session. Prompts 1–3 **ask for values** (they unblock code fixes
that are currently guesswork); prompts 4–6 **make edits** in Figma.

Design space is 393×852 at 1×. Report every coordinate in frame-relative px at
1× so it can be compared to the code directly.

---

## 1. Quiz landing spotlight gradients — BLOCKING a code fix

> In the frame `1114:158` (Quiz landing), find the two spotlight beam vector
> layers — they are named something like "Vector 8" and "Vector 7" and form the
> two cream light beams raking down from the top of the stage.
>
> For **each** beam, report exactly:
> - the layer name and its x/y/width/height in frame coordinates
> - the full fill definition: gradient type, every colour stop as `offset → hex
>   + opacity`, and the gradient handle positions (start and end) in normalised
>   0–1 coordinates
> - the layer's own opacity and blend mode
>
> Then do the same for the dark overlay layer that washes the bottom of the
> stage toward black (it may be called "gradient overlay"): its x/y/width/height,
> every colour stop, handle positions, opacity and blend mode.
>
> Do not change anything. Just report the values as a list.

**Why:** the built beams fade too early. Measured at x=120 the frame reads
`#f5e8b3 / #d9cda6 / #6c665d` at y=420/470/570 where the build renders
`#cdc197 / #6c6666 / #302c38`. Two guesses at the gradient made it worse, so the
real stop values are needed.

---

## 2. About screen composition — BLOCKING a rebuild

> In the frame `2172:3625` (Account / About Polari), answer these:
>
> 1. The illustration at the top left (the seated character with a teacup).
>    Is the lime/yellow angular shape behind them **part of the same image
>    layer**, or a separate vector/shape layer sitting behind it? Give the
>    x/y/width/height of each layer involved, in frame coordinates.
> 2. Report the exact x/y/width/height of the white content card that begins
>    below the intro text.
> 3. For the heading "The story behind the lingo", and for the section heading
>    "What is Polari?", and for the body paragraph starting "Polari is a form of
>    cant slang": report font family, font weight, font size, line height,
>    letter spacing, colour, and the text layer's x/y/width/height.
>
> Do not change anything. Just report the values.

**Why:** the built screen has the card 13px high, the story heading rendering
171px wide where the frame measures 186, and the illustration at a different
aspect ratio than the frame (112×190 vs 132×190) — so `resizeMode: contain`
cannot match both dimensions. Whether the lime shape ships inside the PNG
decides the fix.

---

## 3. Collections hub trio artwork

> In the frame `1117:1578` (Collections / Hub — Signed Out), look at the group of
> three character illustrations with the coloured angular panels behind them.
>
> Report, in frame coordinates:
> - the x/y/width/height of the **group as a whole**
> - the x/y/width/height of **each** of the three character images
> - the x/y/width/height of **each** coloured panel behind them, plus its fill hex
> - whether the panels are separate shape layers or baked into the images
>
> Do not change anything. Just report the values.

**Why:** the built trio spans 342px wide where the frame measures 309, with the
heights matching — so it is the rightmost figure or its panel that is misplaced,
not a uniform scale.

---

## 4. Resolve the Change Password / Forgot Password node conflict — EDIT

> Two of our records disagree about which frame is which, and one frame has a
> button label that contradicts its own content. Please check and fix.
>
> 1. Tell me the exact name of node `2149:3060` and of node `2444:2636`.
> 2. One of them is the **Change Password** screen: a white card containing
>    CURRENT PASSWORD, a "FORGOT PASSWORD?" link, NEW PASSWORD, REENTER NEW
>    PASSWORD, and a "Your password must include:" checklist. Its primary button
>    at the bottom currently reads **"Send Reset Link"**. That is wrong — the
>    screen changes a password inline and never sends an email. Change that
>    button's label to **"Confirm"**.
> 3. The other is the **Forgot Password** screen: a card with a single EMAIL
>    field. Its "Send Reset Link" button is correct — leave it alone.
> 4. Confirm both frames are named clearly and distinctly ("Change Password" and
>    "Forgot Password") so they cannot be confused again, and tell me the final
>    node id of each.

**Why:** our screen CSV maps `2149:3060` to Change Password, but the snapshot
list verified on 2026-08-02 maps `2149:3060` to Forgot Password and Change
Password to `2444:2636`. The stray "Send Reset Link" on a change-password layout
is what a duplicated-and-not-relabelled frame looks like.

---

## 5. Create the missing Sign In frame — EDIT

> There is no Sign In screen anywhere in this file, but the app needs one and it
> is currently built without a design to follow.
>
> Create a new 393×852 frame named **"Sign In"** in the Account section, built
> from the same skeleton as `2444:2697` (Create Account):
> - the same back chip at x17 y52, reading "Account"
> - the same centred display-face title at cap line y89, reading "Sign In"
> - the same white card at x26 y186, width 342, 1px #A4ACB9 edge, 14px corner
>   radius, containing two notched pill fields at 45px tall: **EMAIL** then
>   **PASSWORD**, 12px apart
> - a right-aligned underlined "FORGOT PASSWORD?" link below the password field,
>   styled exactly as the one on the Change Password frame
> - the same centred blue pill button, 243×50, top edge at y659, reading
>   **"Sign In"**
> - below it, centred, "Don't have an account yet? Create one" with "Create one"
>   in blue #0C66E4 and underlined
> - the standard navbar at the foot, Account tab active
>
> Then tell me the new frame's node id.

**Why:** the redesign drew Create Account, Create Account Success, Forgot
Password and Change Password but never Sign In, so that one screen is the only
part of the account flow built to a guess rather than a frame.

---

## 6. Frame inventory for the tracking list

> List every top-level frame on the Mockups page as `name — node-id — width×height`.
> Flag any frame that is not 393 wide, and any two frames whose names are
> duplicates or near-duplicates.

**Why:** `scripts/figma-snapshot.json` has geometry for 18 of the 44 frames the
generator lists, and 4 of its 18 entries point at node ids the generator no
longer lists. A current inventory is needed to fix both ends.

---

# Round 2 — corrections after the first run

The first round left two problems in the file. Run these before re-exporting.

## 7. Undo the right-alignment — EDIT

> In frames `2172:3625` (Account/About) and `2444:2697` (Account/Create Account),
> some text has ended up **right-aligned** that should be left-aligned. Please
> set horizontal text alignment back to LEFT on:
>
> - In `2444:2697`: the "Password requirements text" layer (`2444:2719`) — the
>   "Your password must include:" heading and its four bullet lines. Bulleted
>   lists must read from a straight left edge.
> - In `2172:3625`: the three section titles and three section body paragraphs
>   inside "Polari main container" (`2181:3753`) — nodes `2172:3725`,
>   `2172:3723`, `2172:3730`, `2172:3731`, `2172:3751`, `2172:3752`.
>
> Leave "The story behind the lingo" and its description centred if they already
> are — only the card body copy and the checklist should change. Do not move,
> resize or restyle anything else, and do not touch the illustration removal on
> About, which was deliberate.
>
> Confirm which layers you changed.

## 8. Bring the Sign In frame onto the account-form geometry — EDIT

> The new `2666:2894` (Account/Sign In) does not match the other three account
> form screens. Please correct it so it is consistent with `2444:2697`
> (Create Account):
>
> 1. Its primary button is at x98 y608, 199 wide. That is the *signed-out
>    Account gate's* button, not this flow's. Move it to **x76 y659, 242×50** —
>    the same slot as Create Account's "continue button" (`2444:2720`).
> 2. Move the "Create account prompt" text (`2664:2948`) down so it sits below
>    the button — Create Account's flow puts it at roughly y723.
> 3. Check the two "Password input field" instances use the same component and
>    spacing as Create Account: 49 tall with a **57px pitch** (i.e. 8px between
>    containers). Report what they currently are.
> 4. Confirm the card is x26 y186 w342 with a 1px #A4ACB9 stroke and 14 radius.
>
> Report the final position of the button and the prompt text.
