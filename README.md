# CampusConnect

Learn Together. Grow Together. A social + academic platform for polytechnic students.

## How to run
1. Open `index.html` with VS Code "Live Server", or deploy with Firebase Hosting (`firebase deploy --only hosting`).
2. Sign up with email or Google. Your profile is created automatically.

## Folder structure
```
campusconnect/
├── index.html              Page shell: loads CSS, libraries and scripts, holds the shared modal
├── css/style.css           Design system
├── js/
│   ├── config.js           Firebase project settings (public values)
│   ├── firebase.js         Firebase app, Auth and Firestore setup
│   ├── auth.js             Sign up, sign in, Google login, sign out, login page
│   ├── db.js               Loads and saves data in Firestore
│   ├── data.js             Demo sample data (used only for first-time group setup)
│   ├── components.js       Header, navigation, modal, toast, post card, composer
│   ├── router.js           Hash router: #/home, #/user/3, #/messages/3
│   ├── app.js              Boots the app
│   └── pages/              home, profile, user, groups, resources, qa, notices,
│                           events, lost-found, notifications, admin, messages, institute
└── sw.js                   Service worker (app shell cache)
```

## Features
- **Home, Groups, Q&A, Resources, Notices, Events, Lost & Found** – community feed and academic sections.
- **Follow system** – follow people; their posts appear under the Following menu, and followers get notifications.
- **Messages** – one-to-one chat with photo and file attachments (up to 600 KB for files). Recent chats are listed first, then all users.
- **Live alerts** – new messages open a chat window, play a sound, show a toast, and send a browser notification when the tab is in the background. The red badge counts unread messages.
- **CampusConnect Assistant** – the floating 🪄 button opens a fixed-answer helper for notices, events, groups, online users and how-to questions. It works in English and Bangla and needs no external AI service.
- **Dark mode** – switch from the profile menu.

## Firestore rules (required)
All rules are in `firestore.rules`. In the Firebase Console (Firestore Database → Rules), replace the whole rules text with this file and press **Publish**. Or deploy it with `firebase deploy --only firestore:rules` after adding `"firestore": {"rules": "firestore.rules"}` to `firebase.json`.

If a feature stops working with a "Missing or insufficient permissions" error, the rules were not published or an old version is still active.

## Data notes
- Users can edit only their own name, department, semester, bio, skills, interests, batch and photos. `role` and `status` can be changed only by admins (enforce this in the users rules too).
- The Admin Panel is hidden in the UI for non-admins, but real protection comes from Firestore rules.

## Rules followed from the project document
All labels in English; Bengali only inside sample posts and notices. Bootstrap 5 only (plus one custom stylesheet). No Buy & Sell.

## Next phases
Phase 2: Node.js + Express + MongoDB (optional, if the project moves off Firebase).
