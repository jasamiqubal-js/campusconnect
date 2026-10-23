/* bot.js: CampusConnect Assistant. Fixed answers, FAQ knowledge base and live campus data. No external AI. */
const BOT = { name: 'CampusConnect Assistant', creator: 'Iqubal' }; // change the creator name here
let botHistory = [];

const botIsBn = t => /[\u0980-\u09FF]/.test(t);
const botTokens = t => t.split(/[^\p{L}\p{M}\p{N}]+/u).filter(Boolean);
const botGreet = bn => {
  const h = new Date().getHours();
  if (bn) return h < 12 ? 'শুভ সকাল' : h < 17 ? 'শুভ দুপুর' : h < 19 ? 'শুভ বিকাল' : 'শুভ সন্ধ্যা';
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : h < 19 ? 'Good evening' : 'Good night';
};
const botRow = (label, value) => `<li><b>${esc(label)}:</b> ${value}</li>`;
const botList = items => `<ul class="bot-list">${items.join('')}</ul>`;

function botUpcoming() {
  const now = new Date(), start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return EVENTS.map(e => ({ e, d: new Date(`${e.mon} ${e.day}, ${now.getFullYear()}`) }))
    .filter(x => !isNaN(x.d) && x.d.getTime() >= start).sort((a, b) => a.d - b.d);
}

// Each intent: keywords that trigger it, and the answer (bn = Bangla question?)
const BOT_INTENTS = [
  { kw: ['hi', 'hello', 'hey', 'hlw', 'salam', 'assalamu', 'হাই', 'হ্যালো', 'সালাম', 'আসসালামু', 'নমস্কার', 'good morning', 'good afternoon', 'good evening', 'good night', 'সুপ্রভাত', 'শুভ সকাল', 'শুভ সন্ধ্যা'],
    ans: bn => bn ? `${botGreet(true)}! আমি ${BOT.name}। কী জানতে চান?` : `${botGreet(false)}! I'm ${BOT.name}. How can I help you today?` },
  { kw: ['how are you', 'how r u', 'how you doing', 'kemon acho', 'kemon aso', 'কেমন আছো', 'কেমন আছেন', 'কেমন আছ', 'কি খবর', 'ki khobor'],
    ans: bn => bn ? 'আমি ভালো আছি, ধন্যবাদ! CampusConnect নিয়ে যেকোনো প্রশ্ন করতে পারেন।' : "I'm doing great, thanks for asking! Ask me anything about CampusConnect." },
  { kw: ['who created', 'who made', 'creator', 'developer', 'who built', 'made you', 'created you', 'তোমাকে কে', 'আপনাকে কে', 'কে বানিয়েছে', 'কে তৈরি', 'বানিয়েছে', 'তৈরি করেছে', 'তৈরি করল'],
    ans: bn => bn ? `আমি ${BOT.name}। আমাকে ${BOT.creator} CampusConnect এর জন্য তৈরি করেছেন।` : `I'm ${BOT.name}, created by ${BOT.creator} for the CampusConnect community.` },
  { kw: ['your name', 'who are you', 'what are you', 'tomar nam', 'তোমার নাম', 'আপনার নাম', 'তুমি কে', 'আপনি কে'],
    ans: bn => bn ? `আমার নাম ${BOT.name}।` : `My name is ${BOT.name}.` },
  { kw: ['thanks', 'thank you', 'thx', 'dhonnobad', 'ধন্যবাদ', 'থ্যাংকস'],
    ans: bn => bn ? 'স্বাগতম! 😊' : "You're welcome! 😊" },
  { kw: ['bye', 'goodbye', 'see you', 'khoda hafez', 'খোদা হাফেজ', 'বিদায়'],
    ans: bn => bn ? 'আবার দেখা হবে! 👋' : 'Goodbye! Have a great day. 👋' },
  { kw: ['help', 'what can you do', 'commands', 'কী পারো', 'কি পারো', 'সাহায্য', 'কি কি পারো'],
    ans: bn => bn
      ? `আমি এসব বিষয়ে বলতে পারি: নোটিশ, ইভেন্ট, গ্রুপ, অনলাইন সংখ্যা, পোস্ট, follow, message, Lost & Found, Resources, Q&A, account, dark mode।`
      : `I can help with: notices, events, groups, who is online, posting, following, messages, Lost & Found, resources, Q&A, account, and dark mode.` },
  { kw: ['notice', 'notices', 'নোটিশ', 'নোটিস'],
    ans: bn => { const n = NOTICES.slice(0, 3); if (!n.length) return bn ? 'এখন কোনো নোটিশ নেই।' : 'There are no notices yet.';
      const head = bn ? 'সাম্প্রতিক নোটিশ:' : 'Latest notices:';
      return head + botList(n.map(x => `<li><b>${esc(x.title)}</b> <span class="muted">${esc(x.date || '')}</span></li>`)); } },
  { kw: ['event', 'events', 'next event', 'ইভেন্ট', 'অনুষ্ঠান'],
    ans: bn => { const u = botUpcoming().slice(0, 3); if (!u.length) return bn ? 'কোনো আসন্ন ইভেন্ট নেই।' : 'No upcoming events.';
      return (bn ? 'আসন্ন ইভেন্ট:' : 'Upcoming events:') + botList(u.map(x => { const d = Math.round((x.d - new Date(new Date().setHours(0,0,0,0))) / 86400000);
        return `<li><b>${esc(x.e.title)}</b> <span class="muted">${d === 0 ? (bn ? 'আজ' : 'today') : (bn ? d + ' দিন বাকি' : d + ' days left')}</span></li>`; })); } },
  { kw: ['online', 'who is online', 'অনলাইন'],
    ans: bn => { const n = [...PRESENCE.entries()].filter(([, t]) => Date.now() - t < 3 * 60000).length;
      return bn ? `এখন ${n} জন অনলাইনে আছেন।` : `${n} ${n === 1 ? 'person is' : 'people are'} online right now.`; } },
  { kw: ['groups', 'group list', 'গ্রুপ গুলো', 'গ্রুপের তালিকা', 'কোন গ্রুপ', 'গ্রুপ কয়টা'],
    ans: bn => { const g = GROUPS.slice(0, 5); if (!g.length) return bn ? 'এখন কোনো গ্রুপ নেই।' : 'There are no groups yet.';
      return (bn ? `মোট ${GROUPS.length} টি গ্রুপ, কয়েকটি:` : `There are ${GROUPS.length} groups, for example:`) + botList(g.map(x => `<li>${esc(x.name)}</li>`)); } },
  { kw: ['create group', 'new group', 'group banao', 'গ্রুপ বানা', 'গ্রুপ তৈরি', 'নতুন গ্রুপ'],
    ans: bn => bn ? 'Groups পেজে যান → উপরের ডান কোণে "Create group" চাপুন। নাম, বিবরণ, ধরন ও রং দিন।' : 'Go to Groups, click "Create group" at the top right, then fill the name, description, type and color.' },
  { kw: ['post', 'create post', 'how post', 'পোস্ট', 'পোস্ট করব'],
    ans: bn => bn ? 'Home এর উপরের বাক্সে লিখুন, চাইলে ছবি যোগ করুন, তারপর Post চাপুন।' : 'Write in the box at the top of Home, add a photo if you want, then press Post.' },
  { kw: ['follow', 'unfollow', 'ফলো', 'অনুসরণ'],
    ans: bn => bn ? 'কারো নামে click করে Follow চাপুন। তার post দেখবেন Following মেনুতে।' : 'Click a person\'s name and press Follow. Their posts appear in the Following menu.' },
  { kw: ['dark mode', 'dark', 'light mode', 'theme', 'ডার্ক', 'থিম'],
    ans: bn => bn ? 'উপরের ডান কোণে আপনার নামে click করুন, তারপর Dark / light mode চাপুন।' : 'Click your name at the top right, then choose Dark / light mode.' },
  { kw: ['message', 'messages', 'chat', 'inbox', 'msg', 'মেসেজ', 'চ্যাট', 'বার্তা'],
    ans: bn => bn ? 'মেনু থেকে Messages খুলুন। লাল সংখ্যা মানে না পড়া বার্তা। 📎 দিয়ে ছবি বা file পাঠাতে পারবেন।' : 'Open Messages from the menu. The red number shows unread messages. Use 📎 to send photos or files.' },
  { kw: ['lost', 'found', 'lost and found', 'হারানো', 'পাওয়া গেছে', 'হারিয়েছে'],
    ans: bn => bn ? 'Lost & Found এ হারানো বা পাওয়া জিনিসের তথ্য দিন। Admin অনুমোদন দিলে সবাই দেখবে।' : 'Use Lost & Found to report a lost or found item. Everyone sees it after an admin approves.' },
  { kw: ['resource', 'resources', 'notes', 'note', 'pdf', 'book', 'নোট', 'রিসোর্স', 'বই'],
    ans: bn => bn ? 'Resources থেকে ছোট নোট আপলোড করুন, অথবা Google Drive এর link দিন।' : 'Use Resources to upload small notes, or share a Google Drive link.' },
  { kw: ['q&a', 'question', 'qa', 'প্রশ্ন', 'উত্তর'],
    ans: bn => bn ? 'Q&A তে প্রশ্ন করুন, tag দিয়ে ফিল্টার করুন, আর উত্তরে reaction দিন।' : 'Use Q&A to ask questions, filter by tags, and react to answers.' },
  { kw: ['account', 'register', 'sign up', 'signup', 'login', 'sign in', 'একাউন্ট', 'অ্যাকাউন্ট', 'লগইন', 'রেজিস্ট্রেশন'],
    ans: bn => bn ? 'Login পেজে "Create an account" চাপুন। নাম, ইমেইল, পাসওয়ার্ড, বিভাগ ও সেমিস্টার দিন।' : 'On the login page click "Create an account", then fill in name, email, password, department and semester.' },
  { kw: ['badge', 'tick', 'verified', 'ব্যাজ', 'টিক'],
    ans: bn => bn ? 'Admin এর নামের পাশে নীল tick, আর Teacher এর নামের পাশে কালো tick থাকে।' : 'Admins have a blue tick and teachers have a black tick next to their name.' },
  { kw: ['notification', 'notifications', 'bell', 'নোটিফিকেশন', 'নোটিফিকেশন'],
    ans: bn => bn ? 'উপরের ডান কোণের ঘণ্টা আইকনে follow, post, comment, reaction আর নোটিশের নোটিফিকেশন আসে।' : 'The bell at the top right shows notifications for follows, posts, comments, reactions and notices.' },
  { kw: ['institute', 'college', 'polytechnic', 'প্রতিষ্ঠান', 'কলেজ', 'ইনস্টিটিউট'],
    ans: bn => bn ? `${INSTITUTE.name}, ${INSTITUTE.address}। ফোন: ${INSTITUTE.phone}।` : `${INSTITUTE.name}, ${INSTITUTE.address}. Phone: ${INSTITUTE.phone}.` },
  { kw: ['my department', 'my dept', 'my semester', 'my profile', 'আমার বিভাগ', 'আমার সেমিস্টার', 'আমার প্রোফাইল'],
    ans: bn => { const me = App.me(); return bn
      ? `আপনার বিভাগ: ${me.dept || 'এখনো দেওয়া হয়নি'}, সেমিস্টার: ${me.sem || 'এখনো দেওয়া হয়নি'}।`
      : `Your department: ${me.dept || 'not set yet'}, semester: ${me.sem || 'not set yet'}.`; } },
];

/* Knowledge base for the assistant. Matched against the question by shared keywords. */
const BOT_FAQ = [
 {
  "q": "What is CampusConnect?",
  "a": "CampusConnect হলো polytechnic students-দের জন্য একটি social ও academic platform, যেখানে students-রা connect হতে, knowledge share করতে এবং academic resources পেতে পারে।"
 },
 {
  "q": "Who can use CampusConnect?",
  "a": "মূলত polytechnic students, teachers এবং authorized administrators CampusConnect ব্যবহার করতে পারবেন, যদি তাঁদের জন্য account access enable থাকে।"
 },
 {
  "q": "What is the purpose of CampusConnect?",
  "a": "এর মূল উদ্দেশ্য হলো academic resources, student discussions, notices এবং campus-related information একটি platform-এ নিয়ে আসা।"
 },
 {
  "q": "Is CampusConnect free to use?",
  "a": "CampusConnect একটি educational community platform হিসেবে তৈরি হচ্ছে। Current access rules ও fees থাকলে সেগুলো website-এ check করুন।"
 },
 {
  "q": "What is the tagline of CampusConnect?",
  "a": "CampusConnect-এর tagline হলো 'Learn Together. Grow Together.' অর্থাৎ একসঙ্গে শেখা এবং একসঙ্গে উন্নতি করা।"
 },
 {
  "q": "How is CampusConnect different from Facebook?",
  "a": "Facebook একটি general social platform, কিন্তু CampusConnect বিশেষভাবে polytechnic students-দের academic collaboration ও campus communication-এর জন্য তৈরি।"
 },
 {
  "q": "Can teachers use CampusConnect?",
  "a": "হ্যাঁ, teacher features enable থাকলে teachers academic guidance, learning materials এবং official announcements share করতে পারবেন।"
 },
 {
  "q": "Can I use CampusConnect on mobile?",
  "a": "হ্যাঁ, website responsive হলে আপনি mobile, tablet এবং desktop থেকে ব্যবহার করতে পারবেন।"
 },
 {
  "q": "How do I create an account?",
  "a": "Registration page-এ যান, required information দিন এবং account তৈরি করার instructions follow করুন, যদি registration available থাকে।"
 },
 {
  "q": "How do I log in?",
  "a": "Login page-এ গিয়ে আপনার account credentials দিয়ে sign in করুন।"
 },
 {
  "q": "What if I forget my password?",
  "a": "Forgot Password option থাকলে সেটি ব্যবহার করুন। না থাকলে platform administrator-এর সঙ্গে যোগাযোগ করুন।"
 },
 {
  "q": "Why can't I log in?",
  "a": "আপনার username, password, internet connection এবং account status check করুন। তারপরও সমস্যা হলে administrator-কে জানান।"
 },
 {
  "q": "How do I log out?",
  "a": "Account menu খুলে Log Out option select করুন, যদি option-টি available থাকে।"
 },
 {
  "q": "Can I change my username?",
  "a": "Edit Profile-এ username editing available থাকলে নতুন username দিয়ে Save Changes করুন।"
 },
 {
  "q": "Is my account information secure?",
  "a": "Account security authentication ও data protection implementation-এর ওপর নির্ভর করে। কখনো নিজের password অন্য কাউকে দেবেন না।"
 },
 {
  "q": "Can I delete my account?",
  "a": "Account Settings-এ deletion option check করুন অথবা administrator-এর কাছে account deletion সম্পর্কে জানতে চান।"
 },
 {
  "q": "How do I change my profile picture?",
  "a": "My Profile-এ যান, Change Profile Picture select করুন, device থেকে image choose করে preview দেখুন এবং save করুন।"
 },
 {
  "q": "How do I change my cover photo?",
  "a": "আপনার profile খুলে Change Cover Photo select করুন, image choose করুন এবং changes save করুন।"
 },
 {
  "q": "Can I edit my bio?",
  "a": "হ্যাঁ, Edit Profile option available থাকলে নিজের bio update করে Save Changes করতে পারবেন।"
 },
 {
  "q": "What information can I add to my profile?",
  "a": "Available fields অনুযায়ী name, username, bio, institute, department, semester, academic session, location ও website যোগ করতে পারবেন।"
 },
 {
  "q": "How do I view my posts?",
  "a": "My Profile খুলে Posts tab select করুন, যদি tab-টি implemented থাকে।"
 },
 {
  "q": "Can I remove my profile picture?",
  "a": "Photo removal feature available থাকলে profile picture options থেকে Remove Photo select করুন।"
 },
 {
  "q": "Can I make my profile private?",
  "a": "Profile visibility settings available থাকলে সেটি change করতে পারবেন। তবে real privacy enforcement-এর জন্য backend security প্রয়োজন।"
 },
 {
  "q": "How can I share my profile?",
  "a": "Share Profile অথবা Copy Profile Link option available থাকলে সেটি ব্যবহার করে অন্যদের সঙ্গে profile share করুন।"
 },
 {
  "q": "How do I create a post?",
  "a": "Home feed-এ গিয়ে post composer-এ আপনার লেখা লিখুন এবং Post button click করুন।"
 },
 {
  "q": "Can I add an image to my post?",
  "a": "Image attachment feature enable থাকলে image select করে preview দেখুন এবং post publish করুন।"
 },
 {
  "q": "How do I like a post?",
  "a": "Post-এর নিচে Like button click করুন। আবার click করলে unlike করা যাবে, যদি feature support করে।"
 },
 {
  "q": "How do I comment on a post?",
  "a": "Post-এর comment section-এ গিয়ে comment লিখুন এবং submit করুন।"
 },
 {
  "q": "Can I edit my post?",
  "a": "নিজের post-এর options menu থেকে Edit Post select করুন, যদি editing feature available থাকে।"
 },
 {
  "q": "How do I delete my post?",
  "a": "নিজের post-এর options menu খুলে Delete select করুন, যদি option-টি available থাকে।"
 },
 {
  "q": "Why can't I see my new post?",
  "a": "Post publish হয়েছে কি না check করুন, feed refresh করুন এবং internet connection verify করুন। Browser-only demo হলে data অন্য device-এ নাও দেখা যেতে পারে।"
 },
 {
  "q": "Can I save a post for later?",
  "a": "Saved Posts feature available থাকলে post-এর options menu থেকে Save Post select করুন।"
 },
 {
  "q": "Where can I find study materials?",
  "a": "CampusConnect-এর Academic Resources অথবা Notes section available থাকলে সেখানে study materials খুঁজুন।"
 },
 {
  "q": "Can I share class notes?",
  "a": "Resource sharing enable থাকলে relevant section থেকে notes upload অথবা attach করতে পারবেন।"
 },
 {
  "q": "How can I ask an academic question?",
  "a": "Appropriate academic discussion section-এ post তৈরি করে আপনার question পরিষ্কারভাবে লিখুন।"
 },
 {
  "q": "What are Study Groups?",
  "a": "Study Groups হলো students-দের collaborative learning space, যেখানে subject নিয়ে discussion, resource sharing এবং exam preparation করা যায়।"
 },
 {
  "q": "How do I join a study group?",
  "a": "Study Groups section খুলে পছন্দের group select করুন এবং Join option থাকলে click করুন।"
 },
 {
  "q": "Can I share PDF files?",
  "a": "PDF sharing website-এর supported file types এবং upload size limits-এর ওপর নির্ভর করে।"
 },
 {
  "q": "Can I share programming code?",
  "a": "Platform support করলে post-এ programming code text হিসেবে share করতে পারবেন। Password বা API key কখনো share করবেন না।"
 },
 {
  "q": "How can I find resources for my department?",
  "a": "Academic Resources section-এ subject, department, semester অথবা relevant keywords দিয়ে search করুন, যদি filtering available থাকে।"
 },
 {
  "q": "Where can I find campus notices?",
  "a": "CampusConnect-এর Notices অথবা Announcements section available থাকলে সেখানে campus notices দেখতে পারবেন।"
 },
 {
  "q": "How do I check upcoming exams?",
  "a": "Authorized teachers বা administrators-এর exam-related announcements check করুন।"
 },
 {
  "q": "Can teachers publish announcements?",
  "a": "Teacher accounts এবং announcement permissions implemented থাকলে teachers announcements publish করতে পারবেন।"
 },
 {
  "q": "What is a verified teacher badge?",
  "a": "এটি একটি indicator, যা platform কর্তৃক verified teacher account identify করতে সাহায্য করে।"
 },
 {
  "q": "Can students create campus events?",
  "a": "Event creation feature এবং student permissions enable থাকলে students events create করতে পারবেন।"
 },
 {
  "q": "How can I report an incorrect notice?",
  "a": "Administrator-এর সঙ্গে যোগাযোগ করুন অথবা report feature available থাকলে সেটি ব্যবহার করুন।"
 },
 {
  "q": "How do I know if a notice is official?",
  "a": "Notice-টি authorized teacher বা administrator account থেকে এসেছে কি না check করুন। Important information institution থেকে verify করুন।"
 },
 {
  "q": "Can I receive event reminders?",
  "a": "Event reminder অথবা notification feature implemented থাকলে reminders পেতে পারবেন।"
 },
 {
  "q": "Why is CampusConnect not loading?",
  "a": "Internet connection check করুন, page reload দিন এবং প্রয়োজন হলে অন্য browser দিয়ে try করুন।"
 },
 {
  "q": "Why did my profile changes disappear?",
  "a": "Changes save হয়নি অথবা browser storage-এর কারণে data হারিয়ে যেতে পারে। আবার save করে refresh দিয়ে verify করুন।"
 },
 {
  "q": "Will my posts appear on another device?",
  "a": "এর জন্য shared server-side database প্রয়োজন। শুধু localStorage ব্যবহার করলে posts সাধারণত একই browser-এ সীমাবদ্ধ থাকে।"
 },
 {
  "q": "Why can't I upload a photo?",
  "a": "Image file type এবং size check করুন। Website হয়তো নির্দিষ্ট format ও size limit support করে।"
 },
 {
  "q": "Does CampusConnect support real-time notifications?",
  "a": "Real-time notifications-এর জন্য notification system এবং প্রয়োজনীয় backend অথবা third-party integration দরকার।"
 },
 {
  "q": "Can I report inappropriate content?",
  "a": "Administrator-এর সঙ্গে যোগাযোগ করুন অথবা report option থাকলে সেটি ব্যবহার করুন।"
 },
 {
  "q": "How do I contact support?",
  "a": "Website-এ official contact information অথবা support option দেওয়া থাকলে সেটি ব্যবহার করুন।"
 },
 {
  "q": "What should I do if I find a bug?",
  "a": "Problem-এর details, reproduce করার steps এবং error message লিখে জানান। Screenshot দিতে পারেন, কিন্তু password বা private information দেবেন না।"
 },
 {
  "q": "Can I use CampusConnect offline?",
  "a": "বেশিরভাগ hosted feature-এর জন্য internet connection দরকার। কিছু previously saved frontend data browser-এ available থাকতে পারে।"
 },
 {
  "q": "How can I suggest a new feature?",
  "a": "CampusConnect development team অথবা administrator-এর কাছে আপনার feature suggestion পাঠান।"
 },
 {
  "q": "Who are you?",
  "a": "আমি CampusConnect AI Assistant। আমি আপনাকে website-এর features বুঝতে, profile manage করতে, academic resources খুঁজতে এবং common technical problems solve করতে guide করতে পারি।"
 },
 {
  "q": "What can you help me with?",
  "a": "আমি Profile Settings, Posts, Comments, Academic Resources, Study Groups, Notices এবং common technical issues সম্পর্কে help করতে পারি। কোনো feature website-এ available না থাকলে সেটা আপনাকে জানাব।"
 }
];

const BOT_STOP = new Set(['a','an','the','is','are','am','be','do','does','did','i','me','my','we','you','your','it','to','of','in','on','at','for','and','or','what','how','can','who','why','when','where','which','if','this','that','with','from','not','এ','এই','কি','কী','কেন','কিভাবে','কেমন','আমি','আপনি','আমার','আপনার','হয়','হবে','কে','নাকি','এবং','থেকে','করে','করব','করতে','যায়','যাবে']);
const botKeyTokens = t => botTokens(t.toLowerCase()).filter(w => w.length > 1 && !BOT_STOP.has(w));
const BOT_FAQ_TOKENS = BOT_FAQ.map(f => ({ a: f.a, toks: [...new Set(botKeyTokens(f.q))] }));

// Returns the best FAQ answer and how many keywords matched, or null when nothing is close enough
function botFaq(q) {
  const u = new Set(botKeyTokens(q));
  let best = null, bestScore = 0, bestFrac = 0;
  BOT_FAQ_TOKENS.forEach(f => {
    if (!f.toks.length) return;
    const shared = f.toks.filter(t => u.has(t)).length;
    const frac = shared / f.toks.length;
    if (shared > bestScore || (shared === bestScore && shared > 0 && frac > bestFrac)) { best = f; bestScore = shared; bestFrac = frac; }
  });
  if (!best) return null;
  return bestScore >= 2 || (bestScore >= 1 && bestFrac >= 0.6) ? { a: best.a, score: bestScore } : null;
}

const BOT_FALLBACK = bn => bn
  ? 'দুঃখিত, এই প্রশ্নের উত্তর আমার কাছে নেই। নোটিশ, ইভেন্ট, গ্রুপ বা কোনো feature নিয়ে জিজ্ঞেস করে দেখুন।'
  : "Sorry, I don't have an answer for that yet. Try asking about notices, events, groups or any feature.";

function botAnswer(q) {
  try {
    const bn = botIsBn(q);
    const lower = q.toLowerCase();
    const tokens = botTokens(lower);
    let best = null, bestScore = 0;
    BOT_INTENTS.forEach(intent => {
      const score = intent.kw.filter(k => k.includes(' ') ? lower.includes(k) : tokens.includes(k)).length;
      if (score > bestScore) { best = intent; bestScore = score; }
    });
    const faq = botFaq(q);
    if (faq && faq.score >= 2 && faq.score > bestScore) return faq.a;
    if (best) return best.ans(bn);
    if (faq) return faq.a;
    return BOT_FALLBACK(bn);
  } catch (e) {
    console.error(e);
    return botIsBn(q) ? 'দুঃখিত, এখন উত্তর দিতে পারছি না। আবার চেষ্টা করুন।' : 'Sorry, I could not answer right now. Please try again.';
  }
}

/* ---------- UI ---------- */
const BOT_CHIPS = ['Hi', 'How are you?', 'Who created you?', 'Latest notices', 'Next event', 'Who is online?', 'How to create a group?', 'Dark mode?'];

function botMsg(role, html) {
  botHistory.push({ role, html });
  const box = document.getElementById('botBody');
  if (!box) return;
  box.insertAdjacentHTML('beforeend', `<div class="bot-msg ${role}"><div class="bot-bubble">${html}</div></div>`);
  box.scrollTop = box.scrollHeight;
}

function botAsk(text) {
  const q = (text || '').trim();
  if (!q) return;
  botMsg('user', esc(q));
  const box = document.getElementById('botBody');
  box.insertAdjacentHTML('beforeend', '<div class="bot-msg bot typing" id="botTyping"><div class="bot-bubble"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div></div>');
  box.scrollTop = box.scrollHeight;
  setTimeout(() => {
    document.getElementById('botTyping')?.remove();
    botMsg('bot', botAnswer(q));
  }, 550);
}

function botGreeting() {
  botMsg('bot', `${botGreet(false)}, ${esc(App.me().name.split(' ')[0] || 'there')}! I'm <b>${BOT.name}</b>. Ask me anything about CampusConnect.`);
}

function botToggle(open) {
  const panel = document.getElementById('botPanel');
  if (!panel) return;
  const show = open === undefined ? panel.hidden : open;
  panel.hidden = !show;
  if (show) {
    if (!botHistory.length) botGreeting();
    setTimeout(() => document.getElementById('botInput')?.focus(), 50);
  }
}

function botClear() {
  botHistory = [];
  document.getElementById('botBody').innerHTML = '';
  botGreeting();
}

function initBot() {
  if (document.getElementById('botFab')) return;
  document.body.insertAdjacentHTML('beforeend', `
    <button id="botFab" class="bot-fab" aria-label="Open ${BOT.name}" onclick="botToggle()">
      <span class="bot-ring"></span><span class="bot-ring r2"></span><span class="bot-ring r3"></span><span class="bot-logo-wrap"><img class="bot-logo" src="icons/logo.png" alt="" width="68" height="68"><span class="bot-shine"></span></span>
    </button>
    <section id="botPanel" class="bot-panel" hidden aria-label="${BOT.name}">
      <header class="bot-head">
        <div class="bot-avatar"><i class="fa-solid fa-robot"></i></div>
        <div class="flex-grow-1 min-w-0"><div class="bot-title">${BOT.name}</div><div class="bot-sub"><span class="bot-live"></span>Campus helper</div></div>
        <button class="bot-icon" onclick="botClear()" aria-label="Clear chat" title="Clear"><i class="fa-solid fa-broom"></i></button>
        <button class="bot-icon" onclick="botToggle(false)" aria-label="Close"><i class="fa-solid fa-xmark"></i></button>
      </header>
      <div id="botBody" class="bot-body"></div>
      <div class="bot-chips">${BOT_CHIPS.map(c => `<button class="bot-chip" data-q="${esc(c)}">${esc(c)}</button>`).join('')}</div>
      <form id="botForm" class="bot-form" autocomplete="off">
        <input id="botInput" class="bot-input" placeholder="Ask in English or বাংলা…" maxlength="300" aria-label="Your question">
        <button class="bot-send" type="submit" aria-label="Send"><i class="fa-solid fa-paper-plane"></i></button>
      </form>
    </section>`);
  document.getElementById('botForm').addEventListener('submit', e => {
    e.preventDefault();
    const input = document.getElementById('botInput');
    botAsk(input.value); input.value = '';
  });
  document.getElementById('botPanel').addEventListener('click', e => {
    const chip = e.target.closest('[data-q]');
    if (chip) botAsk(chip.dataset.q);
  });
}
