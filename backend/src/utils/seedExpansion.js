// Procedural cohort generator: adds ~80+ students on top of the 20 hand-crafted
// anchors, plus proportionate posts/help-requests/swaps/sessions/conversations/
// notifications so the demo data looks like a real campus, not a demo seed.
//
// Deterministic: seeded with a fixed number so re-runs produce the same cohort.
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { Post, Comment } from '../models/Post.js';
import { SwapRequest, Session, Review, CreditTxn } from '../models/SwapRequest.js';
import { Conversation, Message } from '../models/Conversation.js';
import { HelpRequest } from '../models/HelpRequest.js';
import { Notification } from '../models/Notification.js';

const DOMAIN = 'anurag.edu.in';

// Seeded RNG so output is reproducible
function makeRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}
const rng = makeRng(42);
const pick = (arr) => arr[Math.floor(rng() * arr.length)];
const pickN = (arr, n) => {
  const copy = [...arr];
  const out = [];
  for (let i = 0; i < n && copy.length; i++) {
    const idx = Math.floor(rng() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
};

// Realistic Anurag cohort data
const FIRST_NAMES = [
  'Aanya','Aditi','Advait','Akash','Aman','Amrita','Ananya','Anika','Anirudh','Anjali',
  'Ankit','Anushka','Arjun','Aryan','Arya','Atharv','Ayaan','Ayush','Bhargav','Bhavna',
  'Chaitanya','Chirag','Daksh','Darsh','Devika','Dhruv','Eshaan','Gaurav','Gayatri','Harsh',
  'Harshita','Hrithik','Ishaan','Jhanvi','Karan','Karthik','Kavya','Krishna','Kunal','Laksh',
  'Manav','Manish','Meera','Mihir','Misha','Muskan','Nakul','Namrata','Nandini','Neha',
  'Niharika','Nikhil','Nirvan','Nitya','Palak','Parth','Pranav','Prateek','Priyanka','Rahul',
  'Rajat','Rakesh','Rhea','Riddhi','Riya','Rohan','Rudra','Saanvi','Sakshi','Sanjana',
  'Sanya','Sara','Shantanu','Shreya','Siddharth','Simran','Sneha','Srishti','Suhas','Tanvi',
  'Tanya','Tarun','Trisha','Utkarsh','Vaibhav','Vanya','Varun','Vidhi','Vikram','Yash'
];
const LAST_NAMES = [
  'Sharma','Reddy','Patel','Iyer','Nair','Mehta','Pillai','Khan','Verma','Joshi',
  'Bhat','Rao','Kapoor','Saxena','Trivedi','Chatterjee','Banerjee','Mukherjee','Das','Ghosh',
  'Kulkarni','Deshpande','Jain','Agarwal','Garg','Suri','Bhatt','Pandit','Bose','Sen'
];
const DEPTS = ['CSE','IT','ECE','EEE','MECH','CIVIL','CSE-AIML','CSE-DS','CSE-CS','BIOTECH'];
const YEARS = ['1st Year','2nd Year','3rd Year','4th Year'];

const SKILLS = [
  { name:'React', cat:'Web Development' },
  { name:'Node.js', cat:'Web Development' },
  { name:'JavaScript', cat:'Programming' },
  { name:'TypeScript', cat:'Programming' },
  { name:'Python', cat:'Programming' },
  { name:'Java', cat:'Programming' },
  { name:'C++', cat:'Programming' },
  { name:'Go', cat:'Programming' },
  { name:'Rust', cat:'Programming' },
  { name:'DSA', cat:'Other' },
  { name:'System Design', cat:'Other' },
  { name:'MongoDB', cat:'Database' },
  { name:'PostgreSQL', cat:'Database' },
  { name:'MySQL', cat:'Database' },
  { name:'Redis', cat:'Database' },
  { name:'Docker', cat:'DevOps' },
  { name:'Kubernetes', cat:'DevOps' },
  { name:'AWS', cat:'DevOps' },
  { name:'CI/CD', cat:'DevOps' },
  { name:'Git', cat:'DevOps' },
  { name:'Linux', cat:'DevOps' },
  { name:'Figma', cat:'UI/UX' },
  { name:'UI Design', cat:'UI/UX' },
  { name:'Adobe XD', cat:'UI/UX' },
  { name:'Tailwind CSS', cat:'Web Development' },
  { name:'CSS', cat:'Web Development' },
  { name:'Next.js', cat:'Web Development' },
  { name:'Vue.js', cat:'Web Development' },
  { name:'Angular', cat:'Web Development' },
  { name:'Svelte', cat:'Web Development' },
  { name:'Flutter', cat:'Mobile Development' },
  { name:'React Native', cat:'Mobile Development' },
  { name:'iOS Development', cat:'Mobile Development' },
  { name:'Android Development', cat:'Mobile Development' },
  { name:'Machine Learning', cat:'Machine Learning' },
  { name:'Deep Learning', cat:'Machine Learning' },
  { name:'NLP', cat:'Machine Learning' },
  { name:'Computer Vision', cat:'Machine Learning' },
  { name:'Data Science', cat:'Machine Learning' },
  { name:'TensorFlow', cat:'Machine Learning' },
  { name:'PyTorch', cat:'Machine Learning' },
  { name:'Cybersecurity', cat:'Security' },
  { name:'Ethical Hacking', cat:'Security' },
  { name:'Cryptography', cat:'Security' },
  { name:'Blockchain', cat:'Web3' },
  { name:'Solidity', cat:'Web3' },
  { name:'Arduino', cat:'Electronics' },
  { name:'Raspberry Pi', cat:'Electronics' },
  { name:'Embedded Systems', cat:'Electronics' },
  { name:'VLSI', cat:'Electronics' },
  { name:'Signal Processing', cat:'Electronics' },
  { name:'Photography', cat:'Photography' },
  { name:'Video Editing', cat:'Multimedia' },
  { name:'Public Speaking', cat:'Other' },
  { name:'Resume Review', cat:'Other' },
  { name:'Writing', cat:'Writing' },
  { name:'Content Writing', cat:'Writing' },
  { name:'Guitar', cat:'Music' },
  { name:'Piano', cat:'Music' },
  { name:'Singing', cat:'Music' },
  { name:'French', cat:'Languages' },
  { name:'Spanish', cat:'Languages' },
  { name:'German', cat:'Languages' },
  { name:'Japanese', cat:'Languages' },
  { name:'Mandarin', cat:'Languages' },
  { name:'Stock Market', cat:'Finance' },
  { name:'Personal Finance', cat:'Finance' },
  { name:'Accounting', cat:'Finance' },
  { name:'Marketing', cat:'Business' },
  { name:'SEO', cat:'Marketing' },
  { name:'Teaching', cat:'Other' },
  { name:'Cooking', cat:'Other' },
];
const PROFICIENCIES = ['beginner','intermediate','advanced','expert'];
const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

const BIOS = [
  'Curious about everything backend. Will debug your SQL if you bring coffee.',
  'Building side projects nobody asked for. Strong opinions on state management.',
  'Fourth year and finally understanding pointers. Better late than never.',
  'I write Python by day and complain about JavaScript by night.',
  'Music tech nerd. Treat your DAW like an instrument, not a tool.',
  'Pre-final-year, post-internship energy. Looking to give back to juniors.',
  'Half designer, half dev, fully confused about which Figma plugin does what.',
  'Hackathon survivor. Three events, two wins, one chronic sleep deficit.',
  'I will explain monads to you over chai. No, really. I will.',
  'Open source maintainer for a tiny library nobody uses. Proud of it.',
  'Love teaching. Hate being late. Will trade you DSA drills for Figma critiques.',
  'Robotics club regular. Bring your broken drone, leave with a fixed one.',
  'Interested in compilers and low-level stuff. Currently suffering through OS.',
  'Photography is my therapy. Code is my day job. Both are creative.',
  'Comp-sci senior pretending to be a data scientist. Mostly works.',
  'Quiz club captain, debate club dropout. Words are my thing.',
  'Mid-stack developer, occasional UI designer, full-time procrastinator.',
  'EEE major who accidentally learned web dev. No regrets.',
  'Final year. Tired. Will help you anyway.',
  'First-year trying to look like I know what Im doing. I do not.',
];

const POST_TITLES = [
  { intent:'OFFERING', title:'Free Git/GitHub walkthrough this Sunday', body:'Bring a repo that scares you. I will explain branching, rebasing, and conflict resolution in 45 min.', tags:['git','github'], skills:['Git'] },
  { intent:'OFFERING', title:'Pair-programming session on LeetCode mediums', body:'Two of us, two problems, one hour. Pick anything from the NeetCode 150. Bring your attempts.', tags:['dsa','leetcode'], skills:['DSA'] },
  { intent:'OFFERING', title:'Mock HR interviews — limited slots', body:'Practice the non-tech round. Common questions, common pitfalls, calm delivery. 30 min each.', tags:['interview','hr'], skills:['Public Speaking'] },
  { intent:'OFFERING', title:'Docker for beginners — full walkthrough', body:'I will install Docker with you, write a Dockerfile, and run a Node app in a container. Zero prereq.', tags:['docker','devops'], skills:['Docker'] },
  { intent:'OFFERING', title:'Debugging clinic: bring your weirdest bug', body:'I collect bizarre bugs the way some people collect stamps. Show me yours and lets hunt it down.', tags:['debug','help'], skills:['JavaScript'] },
  { intent:'NEED_HELP', title:'Need a Postgres pro to review my schema', body:'Designing a multi-tenant schema for a class project. Normalized to 3NF but queries are slow. 1 credit to whoever helps.', tags:['postgres','sql'], skills:['PostgreSQL'], credit:1 },
  { intent:'NEED_HELP', title:'Stuck on React state lifting — when is context the right call?', body:'Building a settings page with nested components. Prop drilling hurts. Is context overkill for this?', tags:['react','state'], skills:['React'], credit:0 },
  { intent:'NEED_HELP', title:'My ML model overfits the moment I look at it', body:'90% train, 65% val. Tried L2, dropout, more data. What am I missing? Will trade a credit.', tags:['ml','overfit'], skills:['Machine Learning'], credit:1 },
  { intent:'PROJECT', title:'Building a study-tracker for Anurag students — need a backend dev', body:'Next.js + Mongo. Open source. Looking for one backend dev to split the API layer.', tags:['project','open-source'], skills:['Node.js','React'] },
  { intent:'PROJECT', title:'Hackathon team forming — theme: campus sustainability', body:'Two devs, one designer, one pitch-person. Project must run on free hosting.', tags:['hackathon','team'], skills:['React','Figma'] },
];

// Build N procedurally-generated students avoiding name collisions with hand-crafted 20
const HAND_CRAFTED_NAMES = new Set([
  'Aarav Sharma','Diya Reddy','Rohan Patel','Meera Iyer','Karthik Nair','Priya Verma',
  'Sneha Kapoor','Vikram Joshi','Anjali Bhat','Arjun Rao','Ishaan Pillai','Tanya Saxena',
  'Kunal Trivedi','Nandini Chatterjee','Aditi Banerjee','Rahul Mukherjee','Sanya Das',
  'Manav Ghosh','Pooja Reddy','Devansh Pillai'
]);

function generateStudents(count) {
  const out = [];
  const used = new Set([...HAND_CRAFTED_NAMES]);
  while (out.length < count) {
    const fn = pick(FIRST_NAMES);
    const ln = pick(LAST_NAMES);
    const name = `${fn} ${ln}`;
    if (used.has(name)) continue;
    used.add(name);
    const teach = pickN(SKILLS, 2 + Math.floor(rng() * 3)).map(s => ({
      name: s.name, cat: s.cat, prof: pick(PROFICIENCIES.slice(2)) // advanced or expert
    }));
    const learn = pickN(SKILLS.filter(s => !teach.some(t => t.name === s.name)), 1 + Math.floor(rng() * 2)).map(s => ({
      name: s.name, cat: s.cat, prof: pick(PROFICIENCIES.slice(0, 2)) // beginner or intermediate
    }));
    const avail = pickN(DAYS, 1 + Math.floor(rng() * 3)).map(d => {
      const startH = 9 + Math.floor(rng() * 10);
      const durH = 1 + Math.floor(rng() * 3);
      return [d, `${String(startH).padStart(2,'0')}:00`, `${String(Math.min(22, startH+durH)).padStart(2,'0')}:00`];
    });
    const taught = Math.floor(rng() * 10);
    const attended = taught + Math.floor(rng() * 5);
    const ratingsCount = taught + Math.floor(rng() * 4);
    const rating = ratingsCount > 0 ? +(3.5 + rng() * 1.5).toFixed(1) : 0;
    out.push({
      name,
      department: pick(DEPTS),
      year: pick(YEARS),
      bio: pick(BIOS),
      teach, learn, avail,
      credits: 2 + Math.floor(rng() * 12),
      trust: 50 + Math.floor(rng() * 45),
      attended, taught,
      rating, ratingsCount,
      badges: rng() > 0.5 ? ['First Session'] : (rng() > 0.7 ? ['First Session','Helper'] : []),
    });
  }
  return out;
}

export async function expand(extraStudentCount = 80) {
  const password = await bcrypt.hash('password123', 10);
  const generated = generateStudents(extraStudentCount);

  // Insert generated students only (the 20 anchors were already inserted by main seed)
  const docs = generated.map(s => ({
    name: s.name,
    email: `${s.name.toLowerCase().replace(/[^a-z]+/g, '.').replace(/^\.|\.$/g, '')}@${DOMAIN}`,
    passwordHash: password,
    department: s.department,
    year: s.year,
    bio: s.bio,
    photo: { url: `https://i.pravatar.cc/200?u=${encodeURIComponent(s.name)}`, publicId: `gen_${s.name.replace(/\s+/g,'_').toLowerCase()}` },
    skillsCanTeach: s.teach.map(t => ({ name: t.name, category: t.cat, proficiency: t.prof })),
    skillsToLearn: s.learn.map(l => ({ name: l.name, category: l.cat, proficiency: l.prof })),
    availability: s.avail.map(([d, s2, e]) => ({ day: d, start: s2, end: e })),
    timeCredits: s.credits,
    trustScore: s.trust,
    sessionsAttended: s.attended,
    sessionsTaught: s.taught,
    ratingAvg: s.rating,
    ratingsCount: s.ratingsCount,
    badges: s.badges,
    onboarded: true
  }));
  const newUsers = await User.insertMany(docs);
  console.log(`[expand] inserted ${newUsers.length} generated users`);

  // Combine with hand-crafted (fetch them) to know full population for relations
  const allUsers = await User.find({}).lean();
  const byName = Object.fromEntries(allUsers.map(u => [u.name, u]));
  const aarav = byName['Aarav Sharma'];
  const totalUsers = allUsers.length;
  console.log(`[expand] total users now: ${totalUsers}`);

  const inHours = (h) => new Date(Date.now() + h * 3600e3);
  const agoHours = (h) => new Date(Date.now() - h * 3600e3);

  // Signup bonus credit txns for generated users only
  await CreditTxn.insertMany(newUsers.map(u => ({
    user: u._id, type: 'signup_bonus', amount: 2, balanceAfter: u.timeCredits,
    reason: 'Welcome bonus', createdAt: agoHours(168)
  })));

  // Add posts from generated users (~50 posts)
  const postCount = Math.min(50, totalUsers);
  const postDocs = [];
  for (let i = 0; i < postCount; i++) {
    const u = allUsers[Math.floor(rng() * totalUsers)];
    const t = POST_TITLES[i % POST_TITLES.length];
    const doc = {
      author: u._id,
      intent: t.intent,
      title: t.title,
      body: t.body,
      tags: t.tags,
      relatedSkills: t.skills,
    };
    if (t.credit) doc.creditReward = t.credit;
    postDocs.push(doc);
  }
  const insertedPosts = await Post.insertMany(postDocs);
  console.log(`[expand] inserted ${insertedPosts.length} posts`);

  // Help requests (~25)
  const helpCount = Math.min(25, totalUsers);
  const helpDocs = [];
  for (let i = 0; i < helpCount; i++) {
    const u = allUsers[Math.floor(rng() * totalUsers)];
    const skillT = POST_TITLES[i % POST_TITLES.length].skills[0];
    helpDocs.push({
      author: u._id,
      title: `${skillT} question: looking for guidance`,
      description: `Need help with ${skillT} for a class project.`,
      skillNeeded: skillT,
      currentLevel: 'beginner',
      preferredTime: 'any evening',
      creditReward: rng() > 0.6 ? 1 : 0,
      tags: [skillT.toLowerCase().replace(/\s+/g,'-')],
    });
  }
  await HelpRequest.insertMany(helpDocs);
  console.log(`[expand] inserted ${helpDocs.length} help requests`);

  // Swap requests: each generated user sends 1-3 swap requests to random other users
  const swapDocs = [];
  for (const u of newUsers.slice(0, 60)) {
    const nSwaps = 1 + Math.floor(rng() * 3);
    for (let j = 0; j < nSwaps; j++) {
      let recipient = allUsers[Math.floor(rng() * totalUsers)];
      while (String(recipient._id) === String(u._id)) {
        recipient = allUsers[Math.floor(rng() * totalUsers)];
      }
      const teachSkill = u.skillsCanTeach[0]?.name || 'JavaScript';
      const learnSkill = recipient.skillsCanTeach[0]?.name || 'Python';
      const r = rng();
      const status = r < 0.4 ? 'pending' : r < 0.7 ? 'scheduled' : r < 0.85 ? 'completed' : 'cancelled';
      const doc = {
        requester: u._id,
        recipient: recipient._id,
        teachSkill, learnSkill,
        message: `Hey! I think we could help each other. I can teach you ${teachSkill}, want to learn ${learnSkill}?`,
        status,
      };
      if (status === 'pending') {
        doc.proposedTimes = [{ start: inHours(20 + j*4), end: inHours(21 + j*4), proposedBy: u._id, note: 'Flexible' }];
      } else if (status === 'scheduled' || status === 'completed') {
        const startOffset = status === 'completed' ? -100 - j*5 : 6 + j*3;
        const endOffset = startOffset + 1;
        doc.acceptedTime = { start: status === 'completed' ? agoHours(-startOffset) : inHours(startOffset), end: status === 'completed' ? agoHours(-endOffset) : inHours(endOffset) };
        if (status === 'completed') doc.completedAt = agoHours(-endOffset);
      } else {
        doc.cancelledBy = u._id;
      }
      swapDocs.push(doc);
    }
  }
  const insertedSwaps = await SwapRequest.insertMany(swapDocs);
  console.log(`[expand] inserted ${insertedSwaps.length} swap requests`);

  // Sessions + Reviews for completed swaps
  const completedSwaps = insertedSwaps.filter(s => s.status === 'completed');
  const sessionDocs = [];
  const reviewDocs = [];
  const creditTxns = [];
  for (const sr of completedSwaps) {
    const start = sr.acceptedTime.start;
    const end = sr.acceptedTime.end;
    const ses = await Session.create({
      swapRequest: sr._id,
      teacher: sr.requester, learner: sr.recipient,
      teachSkill: sr.teachSkill, learnSkill: sr.learnSkill,
      scheduledStart: start, scheduledEnd: end,
      durationMinutes: 60, status: 'completed',
      verifiedAt: end, verifiedBy: [sr.requester, sr.recipient],
      startedAt: start, completedAt: end,
      summary: `Great session on ${sr.teachSkill}. Walked through the basics and a small project.`,
      creditSettled: true,
    });
    sr.session = ses._id;
    await sr.save();
    sessionDocs.push(ses);
    const rating = 4 + Math.floor(rng() * 2);
    reviewDocs.push(
      { session: ses._id, swapRequest: sr._id, rater: sr.requester, ratee: sr.recipient, rating, comment: 'Solid session, clear explanations.' },
      { session: ses._id, swapRequest: sr._id, rater: sr.recipient, ratee: sr.requester, rating: rating === 5 ? 5 : 4, comment: 'Came prepared, asked great questions.' },
    );
    const teacher = allUsers.find(u => String(u._id) === String(sr.requester));
    const learner = allUsers.find(u => String(u._id) === String(sr.recipient));
    creditTxns.push(
      { user: sr.requester, type: 'session_earned_teach', amount: 1, balanceAfter: teacher.timeCredits, reason: `Taught ${sr.teachSkill}`, session: ses._id, swapRequest: sr._id, createdAt: end },
      { user: sr.recipient, type: 'session_spent_learn', amount: -1, balanceAfter: learner.timeCredits, reason: `Learned ${sr.learnSkill}`, session: ses._id, swapRequest: sr._id, createdAt: end },
    );
  }
  await Review.insertMany(reviewDocs);
  await CreditTxn.insertMany(creditTxns);
  console.log(`[expand] inserted ${sessionDocs.length} sessions, ${reviewDocs.length} reviews, ${creditTxns.length} credit txns`);

  // Conversations + Messages for some swaps (so chat is populated)
  const convPairs = [];
  for (const sr of insertedSwaps.slice(0, 40)) {
    const conv = await Conversation.create({
      participants: [sr.requester, sr.recipient],
      swapRequest: sr._id,
      context: { teachSkill: sr.teachSkill, learnSkill: sr.learnSkill },
    });
    convPairs.push({ conv, sr });
    const nMsgs = 1 + Math.floor(rng() * 4);
    const msgs = [];
    for (let m = 0; m < nMsgs; m++) {
      const isRequester = m % 2 === 0;
      msgs.push({
        conversationId: conv._id,
        sender: isRequester ? sr.requester : sr.recipient,
        text: isRequester
          ? `Hey, saw your profile. Could swap ${sr.teachSkill} for ${sr.learnSkill}?`
          : `Sounds good. What times work for you?`,
        createdAt: agoHours(48 - m * 6),
      });
    }
    await Message.insertMany(msgs);
  }
  console.log(`[expand] inserted ${convPairs.length} conversations with messages`);

  // Notifications for active swaps (a couple per recipient)
  const notifDocs = [];
  for (const sr of insertedSwaps.slice(0, 30)) {
    if (sr.status === 'pending') {
      notifDocs.push({
        user: sr.recipient, type: 'swap_request',
        title: 'New swap request',
        body: `${sr.teachSkill} ↔ ${sr.learnSkill}`,
        data: { swapRequest: sr._id },
      });
    } else if (sr.status === 'scheduled' || sr.status === 'completed') {
      notifDocs.push({
        user: sr.recipient, type: 'session_upcoming',
        title: 'Session scheduled',
        body: `${sr.teachSkill} ↔ ${sr.learnSkill}`,
        data: { swapRequest: sr._id },
      });
    }
  }
  await Notification.insertMany(notifDocs);
  console.log(`[expand] inserted ${notifDocs.length} notifications`);

  return {
    totalUsers,
    newUsers: newUsers.length,
    posts: insertedPosts.length,
    helpRequests: helpDocs.length,
    swaps: insertedSwaps.length,
    sessions: sessionDocs.length,
    conversations: convPairs.length,
    notifications: notifDocs.length,
  };
}
