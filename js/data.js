/* =====================================================================
   data.js: DEMO sample data (Phase 1).
   Everything here lives in browser memory only. It resets on refresh.
   In Phase 2 these arrays are replaced by API calls to Node + MongoDB.
   ===================================================================== */
const TODAY = '10 Oct, 2026';
const DEPTS = ['CST', 'EEE', 'Civil', 'Mechanical', 'Electronics', 'Power'];
const CAT_COLORS = { 'Academic': '#DC2626', 'Examination': '#16A34A', 'Class Schedule': '#D97706', 'Holiday': '#0D9488', 'General Announcement': '#2563EB' };
const NOTICE_CATS = Object.keys(CAT_COLORS);
const LOST_CATS = ['Electronics', 'Books & Notes', 'ID Card & Documents', 'Personal Items', 'Others'];
const RES_CATS = ['Lecture Notes', 'Question Bank', 'Lab Manual', 'Assignment', 'Syllabus'];

const USERS = [
  { id: 1, name: 'Jasam Iqubal', role: 'student', dept: 'CST', sem: 5, batch: '2022-23', status: 'Active', bio: 'Frontend learner who enjoys building clean websites.', skills: ['HTML', 'CSS', 'JavaScript', 'Git'], interests: ['Web Development', 'UI Design', 'Cricket'] },
  { id: 2, name: 'Rafiul Islam', role: 'student', dept: 'CST', sem: 4, batch: '2023-24', status: 'Active', bio: '', skills: ['C++', 'Java'], interests: ['Problem Solving'] },
  { id: 3, name: 'Tania Akter', role: 'student', dept: 'EEE', sem: 5, batch: '2022-23', status: 'Active', bio: '', skills: ['Circuit Design'], interests: ['Cultural Events'] },
  { id: 4, name: 'Samiul Hasan', role: 'student', dept: 'CST', sem: 4, batch: '2023-24', status: 'Active', bio: '', skills: ['Python', 'C++'], interests: ['Competitive Programming'] },
  { id: 5, name: 'Nusrat Jahan', role: 'student', dept: 'CST', sem: 5, batch: '2022-23', status: 'Active', bio: '', skills: ['PHP', 'MySQL'], interests: ['Web Development'] },
  { id: 6, name: 'Mehedi Hasan', role: 'student', dept: 'Civil', sem: 6, batch: '2021-22', status: 'Active', bio: '', skills: ['AutoCAD', 'Surveying'], interests: ['Football'] },
  { id: 7, name: 'Md. Abdul Karim', role: 'teacher', dept: 'CST', title: 'Junior Instructor', verified: true, status: 'Active', skills: [], interests: [] },
  { id: 8, name: 'Admin Office', role: 'admin', dept: '', status: 'Active', skills: [], interests: [] },
  { id: 9, name: 'Sumaiya Akter', role: 'student', dept: 'Electronics', sem: 3, batch: '2024-25', status: 'Active', bio: '', skills: [], interests: [] },
  { id: 10, name: 'Farhan Ahmed', role: 'student', dept: 'Mechanical', sem: 7, batch: '2020-21', status: 'Suspended', bio: '', skills: [], interests: [] }
];

const GROUPS = [
  { id: 1, name: 'CST 5th Semester', kind: 'Semester', icon: 'user-group', color: '#123B70', members: 310, joined: true, ownerUid: 7, desc: 'Class updates, assignment reminders and study help for CST 5th semester students.' },
  { id: 2, name: 'Programming Club', kind: 'Interest', icon: 'code', color: '#0D9488', members: 856, joined: true, ownerUid: 4, desc: 'Weekly problem-solving sessions, contests and coding discussions.' },
  { id: 3, name: 'Web Development', kind: 'Interest', icon: 'laptop-code', color: '#2563EB', members: 642, joined: true, ownerUid: 1, desc: 'HTML, CSS, JavaScript, PHP and Node.js: share projects and ask questions.' },
  { id: 4, name: 'Java Learners', kind: 'Interest', icon: 'mug-hot', color: '#1E3A8A', members: 538, joined: true, ownerUid: 2, desc: 'Learn Java and OOP step by step with fellow students.' },
  { id: 5, name: 'CST 6th Semester', kind: 'Semester', icon: 'user-group', color: '#7C3AED', members: 1200, joined: false, ownerUid: 7, desc: 'Official group for CST 6th semester: notices, project work and exam preparation.' },
  { id: 6, name: 'EEE 4th Semester', kind: 'Semester', icon: 'bolt', color: '#D97706', members: 214, joined: false, ownerUid: 7, desc: 'Notes, lab reports and discussions for EEE 4th semester.' },
  { id: 7, name: 'Study Materials Sharing', kind: 'General', icon: 'book-open', color: '#16A34A', members: 930, joined: false, ownerUid: 8, desc: 'Share and request notes, books and previous question papers across departments.' }
];

let POSTS = [
  { id: 1, uid: 2, time: '2 hours ago', text: 'আগামীকাল ডাটা স্ট্রাকচার এর অ্যাসাইনমেন্ট জমা দিতে হবে। কারো কাছে যদি ভালো কোনো রিসোর্স বা নোট থাকে, তাহলে শেয়ার করবেন প্লিজ। 🙏', likes: 32, liked: false,
    comments: [{ uid: 4, text: 'ভাই, আমি একটা নোট শেয়ার করলাম। কাজে লাগবে আশা করি।', time: '1h' }, { uid: 5, text: 'Notes & Resources সেকশনে Linked List-এর নোট আছে, দেখে নিন।', time: '40m' }] },
  { id: 2, uid: 3, time: '5 hours ago', text: 'আমাদের পলিটেকনিকের বার্ষিক সাংস্কৃতিক অনুষ্ঠান আগামী ২৫ অক্টোবর ২০২৬ তারিখে অনুষ্ঠিত হবে। সবাই অংশগ্রহণ করবেন। বিস্তারিত পোস্টে দেওয়া হবে। 🎉', likes: 54, liked: false, comments: [] },
  { id: 3, uid: 5, time: 'Yesterday', text: 'Web Technology ল্যাবে PHP-র form validation নিয়ে একটা সমস্যায় পড়েছি। $_POST খালি আসছে কেন, কেউ বলতে পারবেন?', likes: 11, liked: false, comments: [{ uid: 1, text: 'form-এর method="post" দেওয়া আছে কি না আর input-এ name attribute আছে কি না একবার দেখুন।', time: '20h' }] },
  { id: 4, uid: 6, time: 'Yesterday', text: 'সার্ভেয়িং প্র্যাকটিক্যাল ফাইল জমার শেষ তারিখ ২০ অক্টোবর। সবাই সময়মতো জমা দিন।', likes: 9, liked: false, comments: [] },
  { id: 5, uid: 7, time: '2 days ago', text: 'প্রিয় শিক্ষার্থীরা, Web Technology ল্যাব ফাইল আগামী রবিবারের মধ্যে জমা দিতে হবে। কোনো সমস্যা হলে ক্লাসে জানাবে।', likes: 41, liked: false, file: 'Lab_File_Guidelines.pdf', comments: [] },
  { id: 6, uid: 4, groupId: 2, time: '3 hours ago', text: 'এই শুক্রবার Programming Club-এ C++ problem solving session হবে। Codeforces-এ একটা একাউন্ট খুলে আসবেন।', likes: 18, liked: false, comments: [] },
  { id: 7, uid: 1, groupId: 3, time: 'Yesterday', text: 'Flexbox আর Grid-এর পার্থক্য নিয়ে ছোট একটা নোট বানিয়েছি। কারো লাগলে বলবেন।', likes: 14, liked: false, comments: [{ uid: 5, text: 'অবশ্যই লাগবে ভাই, শেয়ার করুন।', time: '5h' }] },
  { id: 8, uid: 5, groupId: 1, time: '2 days ago', text: 'Database Management System ক্লাস টেস্ট সামনের সপ্তাহে। Normalization ভালোভাবে রিভিশন দিয়ে রাখুন।', likes: 22, liked: false, comments: [] },
  { id: 9, uid: 2, groupId: 4, time: '3 days ago', text: 'OOP-এর inheritance বুঝতে সমস্যা হলে এখানে কমেন্ট করুন, আমরা একসাথে আলোচনা করব।', likes: 8, liked: false, comments: [] }
];

let QUESTIONS = [
  { id: 1, uid: 1, time: '1 day ago', title: 'PHP-তে Session আর Cookie-র মধ্যে মূল পার্থক্য কী?', desc: 'Web Technology ক্লাসে দুটো পড়েছি কিন্তু কখন কোনটা ব্যবহার করব বুঝতে পারছি না। কেউ সহজ করে বুঝিয়ে দেবেন?', tags: ['PHP', 'Web Technology'],
    answers: [
      { id: 1, uid: 7, time: '20 hours ago', accepted: false, text: 'Session-এর data থাকে server-এ, আর Cookie-র data থাকে ব্যবহারকারীর browser-এ। Login-এর মতো গুরুত্বপূর্ণ তথ্য সাধারণত session-এ রাখা হয়।', comments: [] },
      { id: 2, uid: 5, time: '18 hours ago', accepted: false, text: 'Cookie browser-এ জমা থাকে, তাই ব্যবহারকারী চাইলে সেটা দেখতে বা মুছে ফেলতে পারে।', comments: [{ uid: 1, text: 'ধন্যবাদ, এবার পরিষ্কার হলো।' }] }
    ] },
  { id: 2, uid: 2, time: '2 days ago', title: 'Linked List আর Array-এর মধ্যে কোনটা কখন ব্যবহার করা ভালো?', desc: 'Data Structure পরীক্ষার জন্য দুটোর তুলনা বুঝতে চাই।', tags: ['Data Structure'], answers: [] },
  { id: 3, uid: 3, time: '3 days ago', title: 'Transistor-এ Base current বাড়ালে Collector current কেন বাড়ে?', desc: 'BJT-র কার্যনীতি সহজভাবে বুঝতে চাই।', tags: ['Electronics', 'BJT'],
    answers: [{ id: 3, uid: 9, time: '2 days ago', accepted: true, text: 'Base current বাড়লে emitter থেকে বেশি carrier collector-এর দিকে যেতে পারে, ফলে collector current বাড়ে।', comments: [] }] },
  { id: 4, uid: 6, time: '4 days ago', title: 'Theodolite দিয়ে horizontal angle মাপার সঠিক ধাপগুলো কী?', desc: 'প্র্যাকটিক্যালের আগে ধাপগুলো ঝালাই করতে চাই।', tags: ['Surveying'], answers: [] }
];

let NOTICES = [
  { id: 1, cat: 'Academic', date: '10 Oct, 2026', uid: 8, title: '৬ষ্ঠ সেমিস্টার ফাইনাল পরীক্ষার রুটিন প্রকাশ', desc: 'ষষ্ঠ সেমিস্টারের ফাইনাল পরীক্ষার রুটিন নোটিশ বোর্ডে টানানো হয়েছে এবং বিভাগীয় অফিসে পাওয়া যাবে। সবাইকে রুটিন দেখে প্রস্তুতি নিতে অনুরোধ করা হলো।' },
  { id: 2, cat: 'Class Schedule', date: '9 Oct, 2026', uid: 7, title: 'ক্লাস বন্ধের নোটিশ (১৮ অক্টোবর ২০২৬)', desc: 'প্রশাসনিক কারণে ১৮ অক্টোবর ২০২৬ তারিখে CST বিভাগের সকল ক্লাস বন্ধ থাকবে।' },
  { id: 3, cat: 'Examination', date: '8 Oct, 2026', uid: 8, title: 'রেজাল্ট প্রকাশ সংক্রান্ত বিজ্ঞপ্তি', desc: 'চূড়ান্ত ফলাফল প্রকাশিত হয়েছে। শিক্ষার্থীদের নিজ নিজ বিভাগীয় অফিস থেকে মার্কশিট সংগ্রহ করতে বলা হলো।' },
  { id: 4, cat: 'General Announcement', date: '6 Oct, 2026', uid: 8, title: 'সেমিনার: আধুনিক প্রযুক্তি ও ক্যারিয়ার সম্ভাবনা', desc: 'আগামী ২৮ অক্টোবর অডিটোরিয়াম হলে সেমিনার অনুষ্ঠিত হবে। সকল বিভাগের শিক্ষার্থীদের উপস্থিত থাকার অনুরোধ করা হলো।' },
  { id: 5, cat: 'Holiday', date: '5 Oct, 2026', uid: 8, title: 'সরকারি ছুটি উপলক্ষে ইনস্টিটিউট বন্ধের বিজ্ঞপ্তি', desc: 'সরকার ঘোষিত ছুটির তালিকা অনুযায়ী নির্ধারিত দিনগুলোতে ইনস্টিটিউট বন্ধ থাকবে।' }
];

let EVENTS = [
  { id: 1, day: '25', mon: 'Oct', title: 'Annual Cultural Program', desc: 'A day of music, drama and performances by students from all departments.', time: '10:00 AM - 05:00 PM', location: 'Institute Field', organizer: 'Cultural Club', registration: true, registered: false, interested: 128, color: '#DB2777', icon: 'masks-theater' },
  { id: 2, day: '28', mon: 'Oct', title: 'Seminar: Modern Technology & Career Opportunities', desc: 'Guest speakers will discuss career paths in software, electronics and civil engineering.', time: '11:00 AM - 01:00 PM', location: 'Auditorium Hall', organizer: 'Student Affairs Office', registration: true, registered: false, interested: 86, color: '#2563EB', icon: 'microphone-lines' },
  { id: 3, day: '05', mon: 'Nov', title: 'Programming Contest', desc: 'Individual problem-solving contest. Languages allowed: C, C++, Java and Python.', time: '09:00 AM - 04:00 PM', location: 'Computer Lab', organizer: 'Programming Club', registration: true, registered: false, interested: 64, color: '#0D9488', icon: 'code' },
  { id: 4, day: '12', mon: 'Nov', title: 'Blood Donation Awareness Day', desc: 'Awareness session and voluntary donor registration. No registration required.', time: '10:00 AM - 01:00 PM', location: 'Main Gate Corridor', organizer: 'Red Crescent Youth Unit', registration: false, registered: false, interested: 42, color: '#DC2626', icon: 'heart-pulse' }
];

let RESOURCES = [
  { id: 1, title: 'Data Structure: Linked List Notes', subject: 'Data Structure', type: 'PDF', dept: 'CST', sem: 4, cat: 'Lecture Notes', uid: 2, date: '8 Oct, 2026', size: '1.2 MB' },
  { id: 2, title: 'Web Technology Lab Manual (HTML, CSS, JS)', subject: 'Web Technology', type: 'PDF', dept: 'CST', sem: 5, cat: 'Lab Manual', uid: 7, date: '6 Oct, 2026', size: '2.4 MB' },
  { id: 3, title: 'Database Management System Slides', subject: 'DBMS', type: 'PPTX', dept: 'CST', sem: 5, cat: 'Lecture Notes', uid: 5, date: '5 Oct, 2026', size: '3.8 MB' },
  { id: 4, title: 'Basic Electronics: Diode & Transistor Notes', subject: 'Basic Electronics', type: 'PDF', dept: 'EEE', sem: 3, cat: 'Lecture Notes', uid: 3, date: '3 Oct, 2026', size: '1.9 MB' },
  { id: 5, title: 'Surveying Practical Guide', subject: 'Surveying', type: 'DOCX', dept: 'Civil', sem: 4, cat: 'Lab Manual', uid: 6, date: '1 Oct, 2026', size: '860 KB' },
  { id: 6, title: 'Java OOP Cheat Sheet', subject: 'Object Oriented Programming', type: 'Image', dept: 'CST', sem: 4, cat: 'Lecture Notes', uid: 2, date: '28 Sep, 2026', size: '420 KB' },
  { id: 7, title: 'Computer Networks: Previous Question Collection', subject: 'Computer Networks', type: 'PDF', dept: 'CST', sem: 5, cat: 'Question Bank', uid: 1, date: '25 Sep, 2026', size: '2.1 MB' }
];

let LOST = [
  { id: 1, status: 'Lost', title: 'Blue Backpack', desc: 'Blue backpack with a water bottle and notebooks inside.', cat: 'Personal Items', date: '9 Oct, 2026', location: 'Library corridor', contact: 'Contact via Student Affairs Office, Room 102', uid: 6, approved: true },
  { id: 2, status: 'Found', title: 'Student ID Card', desc: 'ID card found near the Admin Building. Name starts with "S".', cat: 'ID Card & Documents', date: '8 Oct, 2026', location: 'Near Admin Building', contact: 'Collect from Student Affairs Office, Room 102', uid: 4, approved: true },
  { id: 3, status: 'Lost', title: 'Scientific Calculator', desc: 'Black scientific calculator with a name sticker on the back.', cat: 'Electronics', date: '7 Oct, 2026', location: 'Computer Lab 2', contact: 'Contact via Student Affairs Office, Room 102', uid: 9, approved: true },
  { id: 4, status: 'Found', title: 'Black Pen Drive (16GB)', desc: 'Found on a desk after the afternoon class.', cat: 'Electronics', date: '6 Oct, 2026', location: 'CST Department', contact: 'Collect from CST Department Office', uid: 5, approved: true },
  { id: 5, status: 'Found', title: 'Data Structure Notebook', desc: 'Handwritten notebook with a green cover.', cat: 'Books & Notes', date: '10 Oct, 2026', location: 'Cafeteria', contact: 'Collect from Student Affairs Office, Room 102', uid: 5, approved: false }
];

let NOTIFS = [
  { id: 1, icon: 'comment', color: '#2563EB', text: 'Samiul Hasan commented on your post.', time: '1 hour ago', read: false },
  { id: 2, icon: 'circle-question', color: '#9333EA', text: 'Md. Abdul Karim answered your question about Session and Cookie.', time: '20 hours ago', read: false },
  { id: 3, icon: 'bullhorn', color: '#DC2626', text: 'New notice: ৬ষ্ঠ সেমিস্টার ফাইনাল পরীক্ষার রুটিন প্রকাশ', time: 'Today', read: false },
  { id: 4, icon: 'user-group', color: '#0D9488', text: 'Web Development group has a new post.', time: 'Yesterday', read: true },
  { id: 5, icon: 'calendar-days', color: '#D97706', text: 'Reminder: Annual Cultural Program is on 25 Oct.', time: '2 days ago', read: true }
];

let REPORTS = [
  { id: 1, postId: 3, by: 4, reason: 'Spam or irrelevant', status: 'Open' },
  { id: 2, postId: 4, by: 9, reason: 'Misleading information', status: 'Open' }
];
