// Seed: a realistic 20-person Anurag University cohort for the demo.
// Idempotent: drops the relevant collections then re-inserts.
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import { Post, Comment } from '../models/Post.js';
import { SwapRequest, Session, Review, CreditTxn } from '../models/SwapRequest.js';
import { Conversation, Message } from '../models/Conversation.js';
import { HelpRequest } from '../models/HelpRequest.js';
import { Notification } from '../models/Notification.js';

const DOMAIN = 'anurag.edu.in';

const STUDENTS = [
  {
    name: 'Aarav Sharma', department: 'CSE', year: '3rd Year',
    bio: 'Full-stack dev. React, Node, the usual. Building a campus-events app on weekends. Will teach you Redux if you bring chai.',
    teach: [
      { name: 'React', cat: 'Web Development', prof: 'advanced' },
      { name: 'Node.js', cat: 'Web Development', prof: 'advanced' },
      { name: 'JavaScript', cat: 'Programming', prof: 'expert' }
    ],
    learn: [
      { name: 'Figma', cat: 'Design', prof: 'beginner' },
      { name: 'Python', cat: 'Programming', prof: 'intermediate' }
    ],
    avail: [['Mon','18:00','20:00'], ['Sat','10:00','13:00']],
    credits: 6, trust: 82, attended: 8, taught: 5, rating: 4.7, ratingsCount: 7,
    badges: ['First Session', 'Helper', 'Top Rated']
  },
  {
    name: 'Diya Reddy', department: 'CSE', year: '2nd Year',
    bio: 'UI/UX nerd. I design for fun, prototype in Figma, and judge your colour palette harder than your reviewer will.',
    teach: [
      { name: 'Figma', cat: 'UI/UX', prof: 'advanced' },
      { name: 'UI Design', cat: 'UI/UX', prof: 'expert' }
    ],
    learn: [
      { name: 'React', cat: 'Web Development', prof: 'intermediate' },
      { name: 'Public Speaking', cat: 'Other', prof: 'beginner' }
    ],
    avail: [['Tue','17:00','19:00'], ['Sat','15:00','18:00']],
    credits: 4, trust: 76, attended: 5, taught: 3, rating: 4.5, ratingsCount: 4,
    badges: ['First Session', 'Helper']
  },
  {
    name: 'Rohan Patel', department: 'ECE', year: '3rd Year',
    bio: 'Embedded systems and a bit of ML. Built a line-following bot in second year that still runs faster than my code review turnaround.',
    teach: [
      { name: 'Python', cat: 'Programming', prof: 'advanced' },
      { name: 'Machine Learning', cat: 'Machine Learning', prof: 'intermediate' },
      { name: 'Arduino', cat: 'Electronics', prof: 'advanced' }
    ],
    learn: [
      { name: 'React', cat: 'Web Development', prof: 'beginner' },
      { name: 'Photography', cat: 'Photography', prof: 'beginner' }
    ],
    avail: [['Wed','19:00','21:00'], ['Sun','10:00','12:00']],
    credits: 3, trust: 70, attended: 3, taught: 2, rating: 4.2, ratingsCount: 3,
    badges: ['First Session', 'Helper']
  },
  {
    name: 'Meera Iyer', department: 'IT', year: '4th Year',
    bio: 'Backend systems, MongoDB, and a soft spot for clean APIs. I will refactor your 200-line route handler with love.',
    teach: [
      { name: 'MongoDB', cat: 'Web Development', prof: 'advanced' },
      { name: 'System Design', cat: 'Other', prof: 'intermediate' },
      { name: 'Node.js', cat: 'Web Development', prof: 'advanced' }
    ],
    learn: [
      { name: 'UI Design', cat: 'UI/UX', prof: 'beginner' },
      { name: 'Public Speaking', cat: 'Other', prof: 'beginner' }
    ],
    avail: [['Mon','18:00','20:00'], ['Sat','10:00','12:00']],
    credits: 5, trust: 80, attended: 6, taught: 4, rating: 4.6, ratingsCount: 5,
    badges: ['First Session', 'Helper']
  },
  {
    name: 'Karthik Nair', department: 'CSE', year: '2nd Year',
    bio: 'DSA enthusiast, LeetCode grinder, future SDE-1. I will talk you through recursion until it clicks.',
    teach: [
      { name: 'DSA', cat: 'Other', prof: 'advanced' },
      { name: 'C++', cat: 'Programming', prof: 'intermediate' }
    ],
    learn: [
      { name: 'Node.js', cat: 'Web Development', prof: 'beginner' },
      { name: 'Figma', cat: 'Design', prof: 'beginner' }
    ],
    avail: [['Thu','20:00','22:00'], ['Sun','10:00','12:00']],
    credits: 2, trust: 65, attended: 2, taught: 1, rating: 4.0, ratingsCount: 2,
    badges: ['First Session']
  },
  {
    name: 'Priya Verma', department: 'CSE', year: '3rd Year',
    bio: 'Frontend, animations, the love of good typography. If your UI looks "off", I will tell you exactly which pixel.',
    teach: [
      { name: 'CSS', cat: 'Web Development', prof: 'expert' },
      { name: 'Tailwind CSS', cat: 'Web Development', prof: 'advanced' },
      { name: 'UI Design', cat: 'UI/UX', prof: 'intermediate' }
    ],
    learn: [
      { name: 'Machine Learning', cat: 'Machine Learning', prof: 'beginner' },
      { name: 'Public Speaking', cat: 'Other', prof: 'beginner' }
    ],
    avail: [['Fri','17:00','19:00'], ['Sat','15:00','18:00']],
    credits: 4, trust: 78, attended: 4, taught: 2, rating: 4.4, ratingsCount: 3,
    badges: ['First Session', 'Helper']
  },
  {
    name: 'Sneha Kapoor', department: 'CSE', year: '4th Year',
    bio: 'Mobile dev (React Native, Flutter). Placed at a startup. Will fix your broken Metro build, for a coffee.',
    teach: [
      { name: 'React Native', cat: 'Mobile Development', prof: 'advanced' },
      { name: 'Flutter', cat: 'Mobile Development', prof: 'intermediate' },
      { name: 'JavaScript', cat: 'Programming', prof: 'advanced' }
    ],
    learn: [
      { name: 'Figma', cat: 'Design', prof: 'beginner' },
      { name: 'Photography', cat: 'Photography', prof: 'beginner' }
    ],
    avail: [['Tue','18:00','20:00'], ['Sat','11:00','13:00']],
    credits: 3, trust: 72, attended: 4, taught: 2, rating: 4.3, ratingsCount: 3,
    badges: ['First Session', 'Helper']
  },
  {
    name: 'Vikram Singh', department: 'CSE', year: '3rd Year',
    bio: 'DevOps, Docker, CI/CD. I will set up your GitHub Actions so you can stop SSH-ing into your EC2.',
    teach: [
      { name: 'Docker', cat: 'Other', prof: 'advanced' },
      { name: 'Git', cat: 'Other', prof: 'expert' },
      { name: 'Node.js', cat: 'Web Development', prof: 'intermediate' }
    ],
    learn: [
      { name: 'Machine Learning', cat: 'Machine Learning', prof: 'beginner' },
      { name: 'UI Design', cat: 'UI/UX', prof: 'beginner' }
    ],
    avail: [['Wed','17:00','19:00'], ['Sun','14:00','16:00']],
    credits: 3, trust: 74, attended: 4, taught: 2, rating: 4.4, ratingsCount: 3,
    badges: ['First Session', 'Helper']
  },
  {
    name: 'Anjali Rao', department: 'ECE', year: '2nd Year',
    bio: 'Math + signal processing. Will help you survive Linear Algebra and not hate matrices forever.',
    teach: [
      { name: 'Mathematics', cat: 'Mathematics', prof: 'advanced' },
      { name: 'Linear Algebra', cat: 'Mathematics', prof: 'intermediate' }
    ],
    learn: [
      { name: 'Python', cat: 'Programming', prof: 'beginner' },
      { name: 'Figma', cat: 'Design', prof: 'beginner' }
    ],
    avail: [['Mon','17:00','19:00'], ['Thu','18:00','20:00']],
    credits: 2, trust: 68, attended: 2, taught: 1, rating: 4.1, ratingsCount: 2,
    badges: ['First Session']
  },
  {
    name: 'Arjun Mehta', department: 'CSE', year: '4th Year',
    bio: 'Ex-SDE intern. System design + interview prep, weekends only. If you can whiteboard, I will mock you.',
    teach: [
      { name: 'System Design', cat: 'Other', prof: 'expert' },
      { name: 'DSA', cat: 'Other', prof: 'advanced' },
      { name: 'Interview Prep', cat: 'Other', prof: 'expert' }
    ],
    learn: [
      { name: 'Photography', cat: 'Photography', prof: 'beginner' },
      { name: 'Public Speaking', cat: 'Other', prof: 'intermediate' }
    ],
    avail: [['Sat','10:00','13:00'], ['Sun','10:00','13:00']],
    credits: 8, trust: 90, attended: 12, taught: 8, rating: 4.8, ratingsCount: 10,
    badges: ['First Session', 'Helper', 'Top Rated', 'Mentor']
  },
  {
    name: 'Ishaan Gupta', department: 'CSE', year: '3rd Year',
    bio: 'Backend dev who drifted into security. CTF player. Will teach you SQL injection, the safe way.',
    teach: [
      { name: 'Cybersecurity', cat: 'Other', prof: 'intermediate' },
      { name: 'Python', cat: 'Programming', prof: 'advanced' },
      { name: 'Linux', cat: 'Other', prof: 'advanced' }
    ],
    learn: [
      { name: 'React', cat: 'Web Development', prof: 'intermediate' },
      { name: 'Public Speaking', cat: 'Other', prof: 'beginner' }
    ],
    avail: [['Mon','19:00','21:00'], ['Fri','17:00','19:00']],
    credits: 4, trust: 76, attended: 5, taught: 3, rating: 4.5, ratingsCount: 4,
    badges: ['First Session', 'Helper']
  },
  {
    name: 'Tanya Bhatt', department: 'CSE', year: '2nd Year',
    bio: 'Frontend dev. React, Next.js, Tailwind. Built a study planner that 200 of my batchmates use. Ask me anything.',
    teach: [
      { name: 'React', cat: 'Web Development', prof: 'advanced' },
      { name: 'Next.js', cat: 'Web Development', prof: 'intermediate' },
      { name: 'Tailwind CSS', cat: 'Web Development', prof: 'advanced' }
    ],
    learn: [
      { name: 'Figma', cat: 'Design', prof: 'beginner' },
      { name: 'DSA', cat: 'Other', prof: 'beginner' }
    ],
    avail: [['Tue','19:00','21:00'], ['Sun','15:00','18:00']],
    credits: 3, trust: 73, attended: 4, taught: 2, rating: 4.3, ratingsCount: 3,
    badges: ['First Session', 'Helper']
  },
  {
    name: 'Kunal Joshi', department: 'ECE', year: '4th Year',
    bio: 'Robotics + IoT guy. I have 3D printers, soldering stations, and a habit of staying late in the lab.',
    teach: [
      { name: 'Arduino', cat: 'Electronics', prof: 'expert' },
      { name: 'Robotics', cat: 'Robotics', prof: 'advanced' },
      { name: 'C++', cat: 'Programming', prof: 'intermediate' }
    ],
    learn: [
      { name: 'React', cat: 'Web Development', prof: 'beginner' },
      { name: 'Machine Learning', cat: 'Machine Learning', prof: 'beginner' }
    ],
    avail: [['Wed','18:00','20:00'], ['Sat','14:00','17:00']],
    credits: 4, trust: 78, attended: 5, taught: 3, rating: 4.5, ratingsCount: 4,
    badges: ['First Session', 'Helper']
  },
  {
    name: 'Nandini Desai', department: 'IT', year: '3rd Year',
    bio: 'Backend + cloud. AWS-certified (cloud practitioner). Will draw you the diagram you actually need.',
    teach: [
      { name: 'AWS', cat: 'Other', prof: 'intermediate' },
      { name: 'Node.js', cat: 'Web Development', prof: 'advanced' },
      { name: 'System Design', cat: 'Other', prof: 'intermediate' }
    ],
    learn: [
      { name: 'UI Design', cat: 'UI/UX', prof: 'beginner' },
      { name: 'Public Speaking', cat: 'Other', prof: 'beginner' }
    ],
    avail: [['Thu','17:00','19:00'], ['Sun','11:00','13:00']],
    credits: 3, trust: 75, attended: 4, taught: 2, rating: 4.4, ratingsCount: 3,
    badges: ['First Session', 'Helper']
  },
  {
    name: 'Aditi Saxena', department: 'CSE', year: '2nd Year',
    bio: 'AI/ML enthusiast, working on a sign-language recognition side project. Will explain backprop without tears.',
    teach: [
      { name: 'Machine Learning', cat: 'Machine Learning', prof: 'intermediate' },
      { name: 'Python', cat: 'Programming', prof: 'advanced' }
    ],
    learn: [
      { name: 'React', cat: 'Web Development', prof: 'beginner' },
      { name: 'Figma', cat: 'Design', prof: 'beginner' }
    ],
    avail: [['Fri','18:00','20:00'], ['Sat','10:00','12:00']],
    credits: 2, trust: 70, attended: 3, taught: 1, rating: 4.2, ratingsCount: 2,
    badges: ['First Session']
  },
  {
    name: 'Rahul Khanna', department: 'CSE', year: '4th Year',
    bio: 'Placed at a fintech. I can talk about payments APIs, KYC, and why your mock interview is harder than the real one.',
    teach: [
      { name: 'System Design', cat: 'Other', prof: 'advanced' },
      { name: 'Interview Prep', cat: 'Other', prof: 'advanced' },
      { name: 'JavaScript', cat: 'Programming', prof: 'expert' }
    ],
    learn: [
      { name: 'Photography', cat: 'Photography', prof: 'beginner' },
      { name: 'Public Speaking', cat: 'Other', prof: 'intermediate' }
    ],
    avail: [['Mon','20:00','22:00'], ['Sun','16:00','18:00']],
    credits: 6, trust: 85, attended: 9, taught: 6, rating: 4.7, ratingsCount: 7,
    badges: ['First Session', 'Helper', 'Top Rated']
  },
  {
    name: 'Sanya Iyer', department: 'CSE', year: '3rd Year',
    bio: 'Game dev in Unity. I will make you write your first shader and you will hate me for exactly 3 hours.',
    teach: [
      { name: 'Unity', cat: 'Other', prof: 'intermediate' },
      { name: 'C#', cat: 'Programming', prof: 'advanced' },
      { name: 'Game Design', cat: 'Other', prof: 'intermediate' }
    ],
    learn: [
      { name: 'UI Design', cat: 'UI/UX', prof: 'beginner' },
      { name: 'Figma', cat: 'Design', prof: 'beginner' }
    ],
    avail: [['Tue','20:00','22:00'], ['Sat','17:00','19:00']],
    credits: 3, trust: 71, attended: 3, taught: 2, rating: 4.2, ratingsCount: 3,
    badges: ['First Session', 'Helper']
  },
  {
    name: 'Manav Choudhary', department: 'ECE', year: '3rd Year',
    bio: 'Hardware tinkerer. Raspberry Pi, ESP32, the works. I will teach you to make your room lights smart (responsibly).',
    teach: [
      { name: 'Arduino', cat: 'Electronics', prof: 'advanced' },
      { name: 'Raspberry Pi', cat: 'Electronics', prof: 'intermediate' },
      { name: 'C', cat: 'Programming', prof: 'advanced' }
    ],
    learn: [
      { name: 'Python', cat: 'Programming', prof: 'intermediate' },
      { name: 'Figma', cat: 'Design', prof: 'beginner' }
    ],
    avail: [['Wed','20:00','22:00'], ['Sun','14:00','16:00']],
    credits: 2, trust: 67, attended: 2, taught: 1, rating: 4.0, ratingsCount: 2,
    badges: ['First Session']
  },
  {
    name: 'Pooja Reddy', department: 'CSE', year: '2nd Year',
    bio: 'Content writer moonlighting as a frontend dev. Strong on soft skills, copy, and turning jargon into words humans use.',
    teach: [
      { name: 'Public Speaking', cat: 'Other', prof: 'advanced' },
      { name: 'Writing', cat: 'Writing', prof: 'expert' },
      { name: 'Resume Review', cat: 'Other', prof: 'advanced' }
    ],
    learn: [
      { name: 'React', cat: 'Web Development', prof: 'beginner' },
      { name: 'DSA', cat: 'Other', prof: 'beginner' }
    ],
    avail: [['Thu','18:00','20:00'], ['Sat','13:00','15:00']],
    credits: 3, trust: 72, attended: 3, taught: 2, rating: 4.3, ratingsCount: 3,
    badges: ['First Session', 'Helper']
  },
  {
    name: 'Devansh Pillai', department: 'CSE', year: '4th Year',
    bio: 'Full-stack + open source maintainer. Will review your PR and explain why you should not have used useEffect for that.',
    teach: [
      { name: 'React', cat: 'Web Development', prof: 'expert' },
      { name: 'Node.js', cat: 'Web Development', prof: 'expert' },
      { name: 'System Design', cat: 'Other', prof: 'advanced' }
    ],
    learn: [
      { name: 'Photography', cat: 'Photography', prof: 'beginner' },
      { name: 'Public Speaking', cat: 'Other', prof: 'intermediate' }
    ],
    avail: [['Mon','19:00','21:00'], ['Sat','10:00','13:00']],
    credits: 7, trust: 86, attended: 10, taught: 7, rating: 4.7, ratingsCount: 8,
    badges: ['First Session', 'Helper', 'Top Rated', 'Mentor']
  }
];

async function main() {
  await connectDB();
  console.log('[seed] wiping collections…');
  await Promise.all([
    User.deleteMany({}), Post.deleteMany({}), Comment.deleteMany({}),
    SwapRequest.deleteMany({}), Session.deleteMany({}),
    Review.deleteMany({}), CreditTxn.deleteMany({}),
    Conversation.deleteMany({}), Message.deleteMany({}),
    HelpRequest.deleteMany({}), Notification.deleteMany({})
  ]);

  const password = await bcrypt.hash('password123', 10);

  // Build users
  const docs = STUDENTS.map((s, i) => ({
    name: s.name,
    email: `${s.name.toLowerCase().replace(/[^a-z]+/g, '.').replace(/^\.|\.$/g, '')}@${DOMAIN}`,
    passwordHash: password,
    department: s.department,
    year: s.year,
    bio: s.bio,
    photo: { url: `https://i.pravatar.cc/200?u=${encodeURIComponent(s.name)}`, publicId: `demo_${s.name.toLowerCase().replace(/\s+/g, '_')}` },
    skillsCanTeach: s.teach.map((t) => ({ name: t.name, category: t.cat, proficiency: t.prof })),
    skillsToLearn: s.learn.map((l) => ({ name: l.name, category: l.cat, proficiency: l.prof })),
    availability: s.avail.map(([day, start, end]) => ({ day, start, end })),
    timeCredits: s.credits,
    trustScore: s.trust,
    sessionsAttended: s.attended,
    sessionsTaught: s.taught,
    ratingAvg: s.rating,
    ratingsCount: s.ratingsCount,
    badges: s.badges,
    onboarded: true
  }));
  const users = await User.insertMany(docs);
  const byName = Object.fromEntries(users.map((u) => [u.name, u]));
  const [aarav, diya, rohan, meera, karthik, priya, sneha, vikram, anjali, arjun,
         ishaan, tanya, kunal, nandini, aditi, rahul, sanya, manav, pooja, devansh] = users;

  // Signup credit txns for everyone
  const inHours = (h) => new Date(Date.now() + h * 3600e3);
  const agoHours = (h) => new Date(Date.now() - h * 3600e3);
  await CreditTxn.insertMany(users.map((u) => ({
    user: u._id, type: 'signup_bonus', amount: 2, balanceAfter: u.timeCredits,
    reason: 'Welcome bonus', createdAt: agoHours(168)
  })));

  // ============ POSTS — variety of intents + real author voice ============
  const [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13, p14, p15] = await Post.insertMany([
    { author: aarav._id, intent: 'OFFERING',
      title: 'Free React + Node office hours this Saturday',
      body: 'I have 90 minutes Saturday at 10 AM. Drop in with your laptop and a question. I will do live debugging, walkthroughs, or a quick code review. No question too small.',
      tags: ['react', 'node', 'javascript'], relatedSkills: ['React', 'Node.js'] },
    { author: diya._id, intent: 'NEED_HELP',
      title: 'Need help choosing between Redux Toolkit and Context for my e-commerce UI',
      body: 'Building a 5-page store for a class project. State is mostly cart + auth + filters. Tutorials are not helping me decide. Can pay 1 credit.',
      tags: ['react', 'redux', 'state'], relatedSkills: ['React'], creditReward: 1 },
    { author: rohan._id, intent: 'PROJECT',
      title: 'Need a frontend dev for a tiny ML demo (image classifier)',
      body: 'I built a small image classifier in Python. Need someone to put a clean React UI on it. I will teach you the ML side in return.',
      tags: ['ml', 'project', 'collab'], relatedSkills: ['Machine Learning', 'React'] },
    { author: meera._id, intent: 'OFFERING',
      title: 'MongoDB aggregation pipelines — happy to pair-program',
      body: 'I love a good $lookup pipeline. Show me your schema and your slow query, and we will fix it in 45 min.',
      tags: ['mongodb', 'database'], relatedSkills: ['MongoDB'] },
    { author: karthik._id, intent: 'NEED_HELP',
      title: 'Stuck on a binary tree BFS — TLE on large inputs (LC 102)',
      body: 'BFS solution times out at N=100000. Tried a deque, tried recursion. Need a 20-min walkthrough. Will pay 1 credit.',
      tags: ['dsa', 'bfs', 'tree'], relatedSkills: ['DSA'], creditReward: 1 },
    { author: priya._id, intent: 'OFFERING',
      title: 'Tailwind tips + accessibility walkthroughs',
      body: 'If your UI looks "off" or your Lighthouse a11y score is in the red, let me know. I will not be polite about it.',
      tags: ['tailwind', 'css', 'a11y'], relatedSkills: ['Tailwind CSS', 'CSS'] },
    { author: sneha._id, intent: 'OFFERING',
      title: 'React Native debugging clinic',
      body: 'Stuck on a build error, Metro refusing to start, or a weird iOS sim crash? Book 30 min with me.',
      tags: ['react-native', 'mobile'], relatedSkills: ['React Native'] },
    { author: vikram._id, intent: 'OFFERING',
      title: 'GitHub Actions for your side project — Sunday slots',
      body: 'I will set up CI/CD on your repo in 30 min. Free this Sunday, bring your repo and a coffee.',
      tags: ['devops', 'github', 'ci'], relatedSkills: ['Docker', 'Git'] },
    { author: anjali._id, intent: 'NEED_HELP',
      title: 'How do I start with Python for signal processing?',
      body: 'I know the math. I do not know the Python tooling. Need a quick orientation: NumPy, SciPy, Jupyter, FFT end-to-end.',
      tags: ['python', 'signals'], relatedSkills: ['Python'] },
    { author: arjun._id, intent: 'OFFERING',
      title: 'Mock system-design interviews — limited slots this weekend',
      body: 'I run a 45-min mock each weekend. Real prompt, structured feedback, then I tell you which textbook to read. DM me.',
      tags: ['system-design', 'interview', 'mentor'], relatedSkills: ['System Design'] },
    { author: devansh._id, intent: 'PROJECT',
      title: 'Open source: building a campus events aggregator. Need a designer + 1 backend dev',
      body: 'Repo is public. Stack: Next.js + Postgres. Need a Figma person and one more backend dev. Credit-based contribution, not money.',
      tags: ['open-source', 'project'], relatedSkills: ['Figma', 'Node.js'] },
    { author: ishaan._id, intent: 'OFFERING',
      title: 'CTF intro — I will walk you through 3 beginner challenges',
      body: 'Crypto, web, forensics — pick one. I will give you a starter challenge and a 30-min debrief. Zero prereq.',
      tags: ['ctf', 'security'], relatedSkills: ['Cybersecurity'] },
    { author: tanya._id, intent: 'NEED_HELP',
      title: 'My Next.js app router is caching like a maniac',
      body: 'Built a small notes app, but routes cache and stale data is showing up after writes. 1 credit to whoever fixes this with me.',
      tags: ['next', 'caching'], relatedSkills: ['Next.js'], creditReward: 1 },
    { author: pooja._id, intent: 'OFFERING',
      title: 'Free resume + LinkedIn review this Saturday',
      body: 'Drop your resume in a DM. I will spend 20 min marking it up. I have placed 4 of my batchmates this year.',
      tags: ['resume', 'career'], relatedSkills: ['Resume Review', 'Writing'] },
    { author: kunal._id, intent: 'OFFERING',
      title: 'Free lab time — bring your Arduino project, I will help you debug',
      body: 'ECE lab, Wednesday evenings. I will bring my multimeter and patience.',
      tags: ['electronics', 'arduino', 'lab'], relatedSkills: ['Arduino'] }
  ]);

  // Comments + likes for richness
  await Comment.insertMany([
    { post: p1._id, author: diya._id, text: 'Will be there. Bringing my whole state-management mess.' },
    { post: p1._id, author: karthik._id, text: 'Saving a seat.' },
    { post: p1._id, author: tanya._id, text: 'Can I bring a friend?' },
    { post: p2._id, author: aarav._id, text: 'I can do a Redux walkthrough tomorrow, ping me.' },
    { post: p2._id, author: tanya._id, text: 'Context is fine until it is not — happy to talk through the tradeoff.' },
    { post: p3._id, author: priya._id, text: 'I can help with the UI, DM me.' },
    { post: p3._id, author: tanya._id, text: 'Count me in for the frontend.' },
    { post: p4._id, author: aarav._id, text: 'Meera is the MongoDB GOAT. Highly recommend.' },
    { post: p5._id, author: arjun._id, text: 'BFS is O(n). If you are TLEing, you are doing something O(n^2) by accident — happy to look.' },
    { post: p10._id, author: karthik._id, text: 'Will book the Sunday slot.' },
    { post: p10._id, author: rahul._id, text: 'Arjun is unreasonably good at this. Take the slot.' },
    { post: p13._id, author: aarav._id, text: 'Cache headers + revalidatePath. DM me, will save you a credit.' }
  ]);
  // bump commentsCount
  for (const [post, n] of [
    [p1, 3], [p2, 2], [p3, 2], [p4, 1], [p5, 1], [p10, 2], [p13, 1]
  ]) {
    await Post.updateOne({ _id: post._id }, { $inc: { commentsCount: n } });
  }
  // likes
  const likePairs = [
    [p1, [diya._id, karthik._id, tanya._id, sneha._id]],
    [p2, [aarav._id, rohan._id, tanya._id]],
    [p3, [priya._id, tanya._id, aarav._id]],
    [p4, [aarav._id, vikram._id, devansh._id, nandini._id]],
    [p5, [arjun._id, kunal._id, rahul._id]],
    [p6, [aarav._id, diya._id, tanya._id, devansh._id]],
    [p10, [karthik._id, rahul._id, devansh._id, ishaan._id]],
    [p13, [aarav._id, devansh._id]],
    [p14, [aarav._id, karthik._id, diya._id, sneha._id, vikram._id, ishaan._id, tanya._id]],
    [p15, [rohan._id, manav._id, aditi._id, anjali._id]]
  ];
  for (const [post, ids] of likePairs) {
    await Post.updateOne({ _id: post._id }, { $addToSet: { likes: { $each: ids } } });
  }

  // ============ HELP REQUESTS (structured) ============
  await HelpRequest.insertMany([
    { author: diya._id, title: 'Redux Toolkit vs Context API for a small e-commerce UI',
      description: 'I am building a 5-page store. State is mostly cart + auth + filters. Should I use Redux or just Context?',
      skillNeeded: 'React', currentLevel: 'comfortable with React, never used Redux',
      tried: 'Watched 2 YouTube videos, still confused about when context is not enough.',
      prerequisites: 'React basics', targetGoal: 'Pick the right tool, set up either Redux or Context cleanly.',
      preferredTime: 'Saturday evening', creditReward: 1, tags: ['react', 'redux', 'state'] },
    { author: karthik._id, title: 'Binary tree: level-order traversal (LC 102) — TLE on large inputs',
      description: 'BFS solution times out on N=100000. What is the standard pattern?',
      skillNeeded: 'DSA', currentLevel: 'solved ~80 LeetCode easy/medium',
      tried: 'BFS with queue, recursion, looked at editorial briefly.',
      errorTrace: 'Time limit exceeded on case N=100000', targetGoal: 'Pass the test, understand BFS complexity.',
      preferredTime: 'any evening', creditReward: 1, tags: ['dsa', 'bfs', 'tree'] },
    { author: anjali._id, title: 'Python for signal processing: getting started with NumPy and SciPy',
      description: 'Have a math background. Need help picking the right Python stack and running a simple FFT.',
      skillNeeded: 'Python', currentLevel: 'new to Python, fluent in MATLAB',
      tried: 'Installed Anaconda, opened Jupyter, then got lost.',
      targetGoal: 'Plot the FFT of a small signal end-to-end.',
      preferredTime: 'Mon or Thu evening', creditReward: 0, tags: ['python', 'numpy', 'signals'] },
    { author: tanya._id, title: 'Next.js app router caching — stale data after mutations',
      description: 'Notes app on Next 14. After POST/DELETE the page shows stale data unless I hard-refresh.',
      skillNeeded: 'Next.js', currentLevel: 'comfortable with React, new to app router',
      tried: 'Added revalidatePath, tried revalidateTag, no change.',
      errorTrace: 'No error — just stale data. Logs show fetch is cached.', targetGoal: 'Pages reflect writes immediately.',
      preferredTime: 'any time', creditReward: 1, tags: ['next', 'caching', 'ssr'] },
    { author: sneha._id, title: 'Flutter: dark mode is broken on iOS only',
      description: 'ThemeProvider works on Android, breaks on iOS. Looks like system theme override.',
      skillNeeded: 'Flutter', currentLevel: 'shipped one Flutter app, never shipped on iOS',
      tried: 'Toggled cupertino override, no change.',
      targetGoal: 'iOS picks up the dark theme without flicker.',
      preferredTime: 'Saturday morning', creditReward: 0, tags: ['flutter', 'ios', 'theming'] }
  ]);

  // ============ SWAP REQUESTS + SESSIONS ============
  // 0) Aarav's incoming pending (so "Received" tab isn't empty for the demo)
  const srIncoming = await SwapRequest.create({
    requester: diya._id, recipient: aarav._id,
    teachSkill: 'Figma', learnSkill: 'React',
    message: 'Need 30 min on React Router before our project review. Can teach you Figma components in return.',
    status: 'pending',
    proposedTimes: [{ start: inHours(20), end: inHours(21), proposedBy: diya._id, note: 'Saturday afternoon' }]
  });

  // 1) Aarav's sent pending
  const srPending = await SwapRequest.create({
    requester: aarav._id, recipient: karthik._id,
    teachSkill: 'React', learnSkill: 'DSA',
    message: 'I can help with state management. Looking to learn DSA for my next interview.',
    status: 'pending',
    proposedTimes: [{ start: inHours(36), end: inHours(37), proposedBy: aarav._id, note: 'Thursday evening' }]
  });

  // 2) An upcoming scheduled swap + session (aarav <-> meera, in 6h)
  const srUpcoming = await SwapRequest.create({
    requester: aarav._id, recipient: meera._id,
    teachSkill: 'React', learnSkill: 'MongoDB',
    message: 'Help me design a clean schema for my campus-events side project?',
    status: 'scheduled',
    acceptedTime: { start: inHours(6), end: inHours(7) }
  });
  const upcomingSession = await Session.create({
    swapRequest: srUpcoming._id,
    teacher: aarav._id, learner: meera._id,
    teachSkill: 'React', learnSkill: 'MongoDB',
    scheduledStart: inHours(6), scheduledEnd: inHours(7),
    durationMinutes: 60, status: 'scheduled'
  });
  srUpcoming.session = upcomingSession._id;
  await srUpcoming.save();

  // 3) A completed/verified session in the past with reviews + credits settled (priya <-> diya)
  const srDone = await SwapRequest.create({
    requester: priya._id, recipient: diya._id,
    teachSkill: 'Tailwind CSS', learnSkill: 'UI Design',
    message: 'Loved the Figma walkthrough last week, want to learn more.',
    status: 'completed',
    acceptedTime: { start: agoHours(72), end: agoHours(71) },
    completedAt: agoHours(71)
  });
  const pastSession = await Session.create({
    swapRequest: srDone._id,
    teacher: priya._id, learner: diya._id,
    teachSkill: 'Tailwind CSS', learnSkill: 'UI Design',
    scheduledStart: agoHours(72), scheduledEnd: agoHours(71),
    durationMinutes: 60, status: 'completed',
    verifiedAt: agoHours(71), verifiedBy: [priya._id, diya._id],
    startedAt: agoHours(72), completedAt: agoHours(71),
    summary: 'Diya walked Priya through auto-layout grids, components, variants, and constraints. Priya is now comfortable designing screens in Figma and exporting to Tailwind. Next session: design tokens + handoff.',
    creditSettled: true
  });
  srDone.session = pastSession._id;
  await srDone.save();
  await Review.create([
    { session: pastSession._id, swapRequest: srDone._id, rater: priya._id, ratee: diya._id, rating: 5, comment: 'Crystal clear, super patient. Loved the examples.' },
    { session: pastSession._id, swapRequest: srDone._id, rater: diya._id, ratee: priya._id, rating: 4, comment: 'Came prepared, asked great follow-up questions.' }
  ]);
  await CreditTxn.insertMany([
    { user: priya._id, type: 'session_earned_teach', amount: 1, balanceAfter: priya.timeCredits, reason: 'Taught Tailwind CSS', session: pastSession._id, swapRequest: srDone._id, createdAt: agoHours(71) },
    { user: diya._id, type: 'session_spent_learn', amount: -1, balanceAfter: diya.timeCredits, reason: 'Learned UI Design', session: pastSession._id, swapRequest: srDone._id, createdAt: agoHours(71) }
  ]);

  // 4) A second past completed session (rohan -> aditi, ML)
  const srDone2 = await SwapRequest.create({
    requester: rohan._id, recipient: aditi._id,
    teachSkill: 'Machine Learning', learnSkill: 'Python',
    message: 'Want to learn how to use Python in your workflow? I will teach you ML basics in return.',
    status: 'completed',
    acceptedTime: { start: agoHours(120), end: agoHours(119) },
    completedAt: agoHours(119)
  });
  const pastSession2 = await Session.create({
    swapRequest: srDone2._id,
    teacher: rohan._id, learner: aditi._id,
    teachSkill: 'Machine Learning', learnSkill: 'Python',
    scheduledStart: agoHours(120), scheduledEnd: agoHours(119),
    durationMinutes: 60, status: 'completed',
    verifiedAt: agoHours(119), verifiedBy: [rohan._id, aditi._id],
    startedAt: agoHours(120), completedAt: agoHours(119),
    summary: 'Rohan introduced Aditi to scikit-learn, showed her how to train a small classifier, and explained train/test split. Aditi left with a working notebook.',
    creditSettled: true
  });
  srDone2.session = pastSession2._id;
  await srDone2.save();
  await Review.create([
    { session: pastSession2._id, swapRequest: srDone2._id, rater: rohan._id, ratee: aditi._id, rating: 5, comment: 'Smart questions, picked it up fast.' },
    { session: pastSession2._id, swapRequest: srDone2._id, rater: aditi._id, ratee: rohan._id, rating: 5, comment: 'Loved the patience with my dumb questions.' }
  ]);
  await CreditTxn.insertMany([
    { user: rohan._id, type: 'session_earned_teach', amount: 1, balanceAfter: rohan.timeCredits, reason: 'Taught Machine Learning', session: pastSession2._id, swapRequest: srDone2._id, createdAt: agoHours(119) },
    { user: aditi._id, type: 'session_spent_learn', amount: -1, balanceAfter: aditi.timeCredits, reason: 'Learned Python', session: pastSession2._id, swapRequest: srDone2._id, createdAt: agoHours(119) }
  ]);

  // 5) A cancelled swap
  const srCancelled = await SwapRequest.create({
    requester: aarav._id, recipient: sneha._id,
    teachSkill: 'Node.js', learnSkill: 'React Native',
    message: 'Wanted to learn native dev.',
    status: 'cancelled', cancelledBy: aarav._id,
    proposedTimes: [{ start: agoHours(120), end: agoHours(119), proposedBy: aarav._id }]
  });

  // 6) An active upcoming session (vikram <-> nandini, devops)
  const srUpcoming2 = await SwapRequest.create({
    requester: nandini._id, recipient: vikram._id,
    teachSkill: 'System Design', learnSkill: 'Docker',
    message: 'Need help containerising my service. Will teach you the tradeoffs of RDS vs DynamoDB.',
    status: 'scheduled',
    acceptedTime: { start: inHours(30), end: inHours(31) }
  });
  const upcomingSession2 = await Session.create({
    swapRequest: srUpcoming2._id,
    teacher: vikram._id, learner: nandini._id,
    teachSkill: 'Docker', learnSkill: 'System Design',
    scheduledStart: inHours(30), scheduledEnd: inHours(31),
    durationMinutes: 60, status: 'scheduled'
  });
  srUpcoming2.session = upcomingSession2._id;
  await srUpcoming2.save();

  // 7) An active OTP-pending session for aarav <-> meera would be too far; instead, an in_progress session for sneha<->arjun that needs verification
  const srInProgress = await SwapRequest.create({
    requester: arjun._id, recipient: sneha._id,
    teachSkill: 'System Design', learnSkill: 'React Native',
    message: 'Mock system design round + a quick React Native question.',
    status: 'scheduled',
    acceptedTime: { start: inHours(-1), end: inHours(0) } // started an hour ago
  });
  const inProgressSession = await Session.create({
    swapRequest: srInProgress._id,
    teacher: arjun._id, learner: sneha._id,
    teachSkill: 'System Design', learnSkill: 'React Native',
    scheduledStart: inHours(-1), scheduledEnd: inHours(0),
    durationMinutes: 60, status: 'in_progress', startedAt: inHours(-1)
  });
  srInProgress.session = inProgressSession._id;
  await srInProgress.save();

  // ============ CONVERSATIONS + MESSAGES ============
  const conv1 = await Conversation.create({
    participants: [aarav._id, karthik._id],
    swapRequest: srPending._id,
    context: { teachSkill: 'React', learnSkill: 'DSA' }
  });
  await Message.insertMany([
    { conversationId: conv1._id, sender: aarav._id, text: 'Hey! Sent you a swap request. Thursday evening works for me.' },
    { conversationId: conv1._id, sender: karthik._id, text: 'Got it. Let me check my schedule and get back to you.' },
    { conversationId: conv1._id, sender: aarav._id, text: 'Cool. I will bring a couple of Redux state machines to look at.' }
  ]);

  const conv2 = await Conversation.create({
    participants: [aarav._id, meera._id],
    swapRequest: srUpcoming._id,
    context: { teachSkill: 'React', learnSkill: 'MongoDB', sessionDate: inHours(6) }
  });
  await Message.insertMany([
    { conversationId: conv2._id, sender: aarav._id, text: 'See you in a few hours. I will bring my schema draft.' },
    { conversationId: conv2._id, sender: meera._id, text: 'Bring questions. I will bring snacks.' }
  ]);

  const conv3 = await Conversation.create({
    participants: [priya._id, diya._id],
    swapRequest: srDone._id,
    context: { teachSkill: 'Tailwind CSS', learnSkill: 'UI Design' }
  });
  await Message.insertMany([
    { conversationId: conv3._id, sender: priya._id, text: 'Thanks again for last week, you were a lifesaver.' },
    { conversationId: conv3._id, sender: diya._id, text: 'Anytime. We should do another round on design tokens.' }
  ]);

  // A conversation between aarav and diya (incoming swap)
  const conv4 = await Conversation.create({
    participants: [aarav._id, diya._id],
    swapRequest: srIncoming._id,
    context: { teachSkill: 'Figma', learnSkill: 'React' }
  });
  await Message.insertMany([
    { conversationId: conv4._id, sender: diya._id, text: 'Hey! Just sent you a swap. I owe you one after the React office hours.' },
    { conversationId: conv4._id, sender: aarav._id, text: 'Saw it. Saturday afternoon is good. Will reply with a slot.' }
  ]);

  // ============ NOTIFICATIONS ============
  await Notification.insertMany([
    { user: aarav._id, type: 'swap_request', title: 'New swap request from Diya',
      body: 'Figma ↔ React', data: { swapRequest: srIncoming._id } },
    { user: aarav._id, type: 'session_upcoming', title: 'Session with Meera in 6 hours',
      body: 'React ↔ MongoDB', data: { swapRequest: srUpcoming._id, session: upcomingSession._id } },
    { user: karthik._id, type: 'swap_request', title: 'New swap request from Aarav',
      body: 'React ↔ DSA', data: { swapRequest: srPending._id } },
    { user: priya._id, type: 'badge_earned', title: 'New badge: Helper',
      body: 'You completed 5 sessions.', data: {} },
    { user: diya._id, type: 'rating_prompt', title: 'Rate your last session',
      body: 'You completed a Tailwind session with Priya.', data: {} },
    { user: sneha._id, type: 'session_upcoming', title: 'Session with Arjun started',
      body: 'System Design ↔ React Native', data: { swapRequest: srInProgress._id, session: inProgressSession._id } },
    { user: vikram._id, type: 'session_upcoming', title: 'Session with Nandini in 30 hours',
      body: 'Docker ↔ System Design', data: { swapRequest: srUpcoming2._id, session: upcomingSession2._id } },
    { user: arjun._id, type: 'badge_earned', title: 'New badge: Mentor',
      body: 'You have taught 8 sessions.', data: {} }
  ]);

  console.log(`[seed] done → users: ${users.length}, posts: 15, help requests: 5, swap requests: 7 (1 incoming pending, 1 sent pending, 1 in_progress, 2 upcoming, 2 completed, 1 cancelled), 2 past verified sessions with reviews`);
  await mongoose.disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
