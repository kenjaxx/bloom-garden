# Bloom Garden — feature update

## How to apply

1. Copy everything in this zip into your project root, preserving paths
   (it will create `app/(tabs)/...` and overwrite `app/index.tsx`,
   `app/register.tsx`, `app/_layout.tsx`, `notifications.js`).
2. **Delete these old files** — they're replaced by `app/(tabs)/*`:
   - `app/garden.tsx`
   - `app/garden.web.tsx`
   - `app/profile.tsx`
3. Deploy `firestore.rules` to your Firebase project:
   ```
   firebase deploy --only firestore:rules
   ```
   (or paste the contents into Firebase Console → Firestore → Rules.)
4. `lottie-react-native` and `@lottiefiles/dotlottie-react` are no longer
   used (the flower is now a small Reanimated component in
   `components/flower-stage.tsx`, since the bundled `flower.json` was an
   empty stub with no layers). You can remove those two packages from
   `package.json` and run `npm install`, or leave them installed if you
   plan to use them elsewhere.
5. Run `npx expo start` and test both the "create garden" and "join
   garden" flows with two accounts.

## What's new

- **Tab navigation** (`app/(tabs)/_layout.tsx`): Garden / History / Profile.
- **One shared `useGarden` hook** replacing the duplicated logic that used
  to live separately in `garden.tsx` and `garden.web.tsx`.
- **Working flower animation** on every platform (no more silent Lottie
  fallback).
- **Streaks**: consecutive days both partners check in, shown as a pill
  and used to trigger celebrations at 7/30/100 days.
- **Partner presence**: live "your partner already checked in" indicator.
- **Check-in notes**: an optional short note attached to each check-in,
  shown to your partner as a speech-bubble.
- **History tab**: a month calendar showing which days you both bloomed.
- **Milestone celebrations**: a full-screen emoji-burst animation when you
  hit a new stage or streak milestone.
- **Garden customization**: pick a flower color/theme from the Profile
  tab, shared by both members.
- **Leave garden** flow from Profile (with confirmation), including
  deleting the garden doc if you're the last member.
- **Forgot password** on the login screen via Firebase's password reset
  email.
- **Firestore security rules** (`firestore.rules`) so gardens can only be
  read/written by their members (with a narrow allowance for the
  join-by-code flow).
- **"Partner checked in" local notification**: fires while the app is
  installed and has notification permission. This is a client-only nudge,
  not a true server push — if you want a reliable notification even when
  both phones are fully closed, that needs a small Cloud Function that
  listens for garden updates and sends via FCM/APNs. Happy to build that
  next if you want it.

## Known follow-ups (not included)

- A dedicated web marketing/landing page for signed-out visitors — the
  current `app/index.tsx` is functional but purely a login form. Let me
  know if you want a proper hero/landing page in front of it.
- True cross-device push notifications (needs a Cloud Function + FCM).
- Full dark-mode pass on `register.tsx` (login/register still use a fixed
  light palette; the authenticated tabs now respect system dark mode via
  `useGardenColors`).
