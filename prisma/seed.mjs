// Seed script for EduFlow - generates SQL and runs via psql
import { randomBytes } from "crypto";
import { execSync } from "child_process";
import "dotenv/config";

const bcryptjs = await import("bcryptjs");
const bcrypt = bcryptjs.default || bcryptjs;
const hashedPassword = await bcrypt.hash("password123", 12);

function cuid() {
  return "c" + randomBytes(12).toString("hex").slice(0, 24);
}
function now() {
  return new Date().toISOString();
}
function esc(s) {
  if (s === null || s === undefined) return "NULL";
  return "'" + String(s).replace(/'/g, "''") + "'";
}

const sqls = [];

// Clean up
const tables = [
  "LiveChat", "LiveAttendance", "LiveSession", "QuizAnswer", "QuizAttempt", "Question", "Quiz",
  "Note", "Bookmark", "Wishlist", "LessonProgress", "Resource", "Lesson", "Section",
  "Review", "Comment", "Discussion", "Certificate", "Payment", "Enrollment", "Coupon",
  "Announcement", "Notification", "Message", "UserAchievement", "Achievement",
  "Course", "Category", "Session", "Account", "User", "SiteSetting", "VerificationToken",
];
for (const t of tables) sqls.push(`DELETE FROM "${t}";`);

// Users
const adminId = cuid();
const inst1Id = cuid();
const inst2Id = cuid();
const inst3Id = cuid();
const stu1Id = cuid();
const stu2Id = cuid();
const stu3Id = cuid();
const stu4Id = cuid();
const stu5Id = cuid();

const users = [
  [adminId, "Admin User", "admin@eduflow.com", "ADMIN", 500, 6, "Platform administrator"],
  [inst1Id, "Dr. Sarah Chen", "instructor@eduflow.com", "INSTRUCTOR", 350, 4, "Senior Software Engineer with 15+ years of experience."],
  [inst2Id, "Prof. Michael Roberts", "michael@eduflow.com", "INSTRUCTOR", 280, 3, "Data Science professor and ML researcher."],
  [inst3Id, "Emily Johnson", "emily@eduflow.com", "INSTRUCTOR", 200, 3, "UX/UI Designer with 10 years of experience."],
  [stu1Id, "Alex Thompson", "student@eduflow.com", "STUDENT", 420, 5, "Full-stack developer in training."],
  [stu2Id, "Maria Garcia", "maria@eduflow.com", "STUDENT", 310, 4, null],
  [stu3Id, "James Wilson", "james@eduflow.com", "STUDENT", 250, 3, null],
  [stu4Id, "Sophie Anderson", "sophie@eduflow.com", "STUDENT", 180, 2, null],
  [stu5Id, "David Kim", "david@eduflow.com", "STUDENT", 150, 2, null],
];
for (const u of users) {
  sqls.push(`INSERT INTO "User" (id, name, email, "hashedPassword", role, "isActive", xp, level, bio, "createdAt", "updatedAt") VALUES (${esc(u[0])}, ${esc(u[1])}, ${esc(u[2])}, ${esc(hashedPassword)}, ${esc(u[3])}, true, ${u[4]}, ${u[5]}, ${esc(u[6])}, '${now()}', '${now()}');`);
}

// Categories
const catIds = Array.from({ length: 8 }, () => cuid());
const cats = [
  ["Web Development", "web-development", "code", "HTML, CSS, JavaScript, React"],
  ["Data Science", "data-science", "chart", "Python, ML, Statistics"],
  ["Mobile Development", "mobile-development", "phone", "iOS, Android, React Native"],
  ["Design", "design", "palette", "UI/UX, Graphic Design, Figma"],
  ["DevOps & Cloud", "devops-cloud", "cloud", "AWS, Docker, Kubernetes"],
  ["Cybersecurity", "cybersecurity", "lock", "Network Security, Ethical Hacking"],
  ["Business", "business", "briefcase", "Entrepreneurship, Marketing"],
  ["AI & Machine Learning", "ai-ml", "brain", "Deep Learning, NLP, Vision"],
];
cats.forEach((c, i) => {
  sqls.push(`INSERT INTO "Category" (id, name, slug, icon, description, "createdAt") VALUES (${esc(catIds[i])}, ${esc(c[0])}, ${esc(c[1])}, ${esc(c[2])}, ${esc(c[3])}, '${now()}');`);
});

// Courses
const c1Id = cuid(), c2Id = cuid(), c3Id = cuid(), c4Id = cuid(), c5Id = cuid(), c6Id = cuid();

sqls.push(`INSERT INTO "Course" (id, title, slug, description, "shortDescription", price, "discountPrice", level, status, "isFeatured", "isFree", duration, "totalLessons", "passingGrade", "certificateEnabled", tags, requirements, "whatYouLearn", "targetAudience", "categoryId", "instructorId", currency, language, "createdAt", "updatedAt") VALUES (${esc(c1Id)}, 'Complete React & Next.js Developer Course', 'complete-react-nextjs-developer', 'Master React and Next.js from scratch. Build full-stack applications with the latest features including server components, app router, and more.', 'Master React and Next.js from scratch.', 49.99, 29.99, 'BEGINNER', 'PUBLISHED', true, false, 1200, 48, 70, true, 'react,nextjs,javascript,typescript', 'Basic HTML/CSS knowledge,A computer with internet', 'Build React apps from scratch,Master Next.js App Router,Implement authentication,Deploy to production', 'Beginners,Developers transitioning to Next.js', ${esc(catIds[0])}, ${esc(inst1Id)}, 'USD', 'English', '${now()}', '${now()}');`);

sqls.push(`INSERT INTO "Course" (id, title, slug, description, "shortDescription", price, "discountPrice", level, status, "isFeatured", "isFree", duration, "totalLessons", "passingGrade", "certificateEnabled", tags, "categoryId", "instructorId", currency, language, "createdAt", "updatedAt") VALUES (${esc(c2Id)}, 'Python for Data Science & Machine Learning', 'python-data-science-ml', 'Learn Python, data analysis with Pandas, and machine learning with Scikit-learn and TensorFlow.', 'Learn Python, data analysis, and ML.', 59.99, 39.99, 'INTERMEDIATE', 'PUBLISHED', true, false, 960, 36, 75, true, 'python,data-science,ml', ${esc(catIds[1])}, ${esc(inst2Id)}, 'USD', 'English', '${now()}', '${now()}');`);

sqls.push(`INSERT INTO "Course" (id, title, slug, description, "shortDescription", price, level, status, "isFeatured", "isFree", duration, "totalLessons", "passingGrade", "certificateEnabled", tags, "categoryId", "instructorId", currency, language, "createdAt", "updatedAt") VALUES (${esc(c3Id)}, 'UI/UX Design Masterclass', 'uiux-design-masterclass', 'Complete UI/UX design course covering user research, wireframing, prototyping, and Figma.', 'Master UI/UX design and Figma.', 39.99, 'BEGINNER', 'PUBLISHED', true, false, 720, 30, 65, true, 'design,uiux,figma', ${esc(catIds[3])}, ${esc(inst3Id)}, 'USD', 'English', '${now()}', '${now()}');`);

sqls.push(`INSERT INTO "Course" (id, title, slug, description, "shortDescription", price, "discountPrice", level, status, "isFeatured", "isFree", duration, "totalLessons", "passingGrade", "certificateEnabled", tags, "categoryId", "instructorId", currency, language, "createdAt", "updatedAt") VALUES (${esc(c4Id)}, 'Docker & Kubernetes Complete Guide', 'docker-kubernetes-complete', 'Master containerization with Docker and orchestration with Kubernetes for production deployments.', 'Master Docker and Kubernetes.', 54.99, 34.99, 'ADVANCED', 'PUBLISHED', false, false, 840, 32, 70, true, 'docker,kubernetes,devops', ${esc(catIds[4])}, ${esc(inst1Id)}, 'USD', 'English', '${now()}', '${now()}');`);

sqls.push(`INSERT INTO "Course" (id, title, slug, description, "shortDescription", price, level, status, "isFeatured", "isFree", duration, "totalLessons", "passingGrade", "certificateEnabled", tags, "categoryId", "instructorId", currency, language, "createdAt", "updatedAt") VALUES (${esc(c5Id)}, 'JavaScript Fundamentals - Free Course', 'javascript-fundamentals-free', 'A free introductory course to JavaScript programming covering variables, functions, and DOM manipulation.', 'Free intro to JavaScript.', 0, 'BEGINNER', 'PUBLISHED', true, true, 360, 18, 60, true, 'javascript,free', ${esc(catIds[0])}, ${esc(inst1Id)}, 'USD', 'English', '${now()}', '${now()}');`);

sqls.push(`INSERT INTO "Course" (id, title, slug, description, "shortDescription", price, level, status, "isFeatured", "isFree", duration, "totalLessons", "passingGrade", "certificateEnabled", tags, "categoryId", "instructorId", currency, language, "createdAt", "updatedAt") VALUES (${esc(c6Id)}, 'Mobile App Development with React Native', 'mobile-app-react-native', 'Build cross-platform mobile apps with React Native and Expo.', 'Build mobile apps with React Native.', 44.99, 'INTERMEDIATE', 'PUBLISHED', false, false, 780, 28, 70, true, 'react-native,mobile', ${esc(catIds[2])}, ${esc(inst1Id)}, 'USD', 'English', '${now()}', '${now()}');`);

// Sections & Lessons for Course 1
const sectionData = [
  { title: "Getting Started", order: 1, lessons: [
    ["Course Introduction", "VIDEO", 10, 1, true, true],
    ["Setting Up Your Dev Environment", "VIDEO", 15, 2, true, false],
    ["Understanding React Fundamentals", "TEXT", 20, 3, false, false],
    ["Your First React Component", "VIDEO", 25, 4, false, false],
  ]},
  { title: "React Core Concepts", order: 2, lessons: [
    ["JSX Deep Dive", "VIDEO", 20, 1, false, false],
    ["Props and State", "VIDEO", 30, 2, false, false],
    ["Event Handling", "VIDEO", 18, 3, false, false],
    ["Conditional Rendering", "VIDEO", 15, 4, false, false],
    ["Lists and Keys", "VIDEO", 22, 5, false, false],
  ]},
  { title: "React Hooks", order: 3, lessons: [
    ["useState and useEffect", "VIDEO", 35, 1, false, false],
    ["useContext", "VIDEO", 25, 2, false, false],
    ["Custom Hooks", "VIDEO", 28, 3, false, false],
  ]},
  { title: "Next.js Fundamentals", order: 4, lessons: [
    ["Introduction to Next.js", "VIDEO", 15, 1, false, false],
    ["File-based Routing", "VIDEO", 25, 2, false, false],
    ["Server vs Client Components", "VIDEO", 30, 3, false, false],
    ["Data Fetching", "VIDEO", 35, 4, false, false],
  ]},
  { title: "Building a Full-Stack App", order: 5, lessons: [
    ["Project Setup", "VIDEO", 30, 1, false, false],
    ["Authentication", "VIDEO", 40, 2, false, false],
    ["CRUD Operations", "VIDEO", 35, 3, false, false],
    ["Deployment", "VIDEO", 20, 4, false, false],
  ]},
];

const firstSectionLessonIds = [];
for (const sec of sectionData) {
  const secId = cuid();
  sqls.push(`INSERT INTO "Section" (id, title, "order", "courseId", "createdAt") VALUES (${esc(secId)}, ${esc(sec.title)}, ${sec.order}, ${esc(c1Id)}, '${now()}');`);
  for (const les of sec.lessons) {
    const lesId = cuid();
    const content = les[1] === "TEXT" ? "Lesson content for " + les[0] + "." : null;
    sqls.push(`INSERT INTO "Lesson" (id, title, type, duration, "order", "isFree", "isPreview", "sectionId", content, "createdAt", "updatedAt") VALUES (${esc(lesId)}, ${esc(les[0])}, ${esc(les[1])}, ${les[2]}, ${les[3]}, ${les[4]}, ${les[5]}, ${esc(secId)}, ${esc(content)}, '${now()}', '${now()}');`);
    if (sec.order === 1) firstSectionLessonIds.push(lesId);
  }
}

// Sections for Course 5 (Free JS)
const jsSections = [
  { title: "JavaScript Basics", order: 1, lessons: [["What is JavaScript?", "VIDEO", 10, 1], ["Variables and Data Types", "VIDEO", 20, 2], ["Operators", "VIDEO", 15, 3]] },
  { title: "Control Flow", order: 2, lessons: [["If/Else Statements", "VIDEO", 15, 1], ["Loops", "VIDEO", 20, 2]] },
  { title: "Functions", order: 3, lessons: [["Function Declarations", "VIDEO", 18, 1], ["Arrow Functions", "VIDEO", 15, 2], ["Scope and Closures", "VIDEO", 25, 3]] },
];
for (const sec of jsSections) {
  const secId = cuid();
  sqls.push(`INSERT INTO "Section" (id, title, "order", "courseId", "createdAt") VALUES (${esc(secId)}, ${esc(sec.title)}, ${sec.order}, ${esc(c5Id)}, '${now()}');`);
  for (const les of sec.lessons) {
    sqls.push(`INSERT INTO "Lesson" (id, title, type, duration, "order", "isFree", "isPreview", "sectionId", "createdAt", "updatedAt") VALUES (${esc(cuid())}, ${esc(les[0])}, 'VIDEO', ${les[2]}, ${les[3]}, true, ${les[3] === 1 && sec.order === 1}, ${esc(secId)}, '${now()}', '${now()}');`);
  }
}

// Minimal sections for other courses
for (const courseId of [c2Id, c3Id, c4Id, c6Id]) {
  const secId = cuid();
  sqls.push(`INSERT INTO "Section" (id, title, "order", "courseId", "createdAt") VALUES (${esc(secId)}, 'Introduction', 1, ${esc(courseId)}, '${now()}');`);
  sqls.push(`INSERT INTO "Lesson" (id, title, type, duration, "order", "isFree", "isPreview", "sectionId", "createdAt", "updatedAt") VALUES (${esc(cuid())}, 'Course Overview', 'VIDEO', 10, 1, true, true, ${esc(secId)}, '${now()}', '${now()}');`);
  sqls.push(`INSERT INTO "Lesson" (id, title, type, duration, "order", "isFree", "isPreview", "sectionId", "createdAt", "updatedAt") VALUES (${esc(cuid())}, 'Getting Started', 'VIDEO', 15, 2, false, false, ${esc(secId)}, '${now()}', '${now()}');`);
  sqls.push(`INSERT INTO "Lesson" (id, title, type, duration, "order", "isFree", "isPreview", "sectionId", content, "createdAt", "updatedAt") VALUES (${esc(cuid())}, 'Core Concepts', 'TEXT', 20, 3, false, false, ${esc(secId)}, 'Lesson content here.', '${now()}', '${now()}');`);
}

// Lesson progress for student1
for (const lesId of firstSectionLessonIds) {
  sqls.push(`INSERT INTO "LessonProgress" (id, "userId", "lessonId", completed, "watchTime", "completedAt", "createdAt", "updatedAt") VALUES (${esc(cuid())}, ${esc(stu1Id)}, ${esc(lesId)}, true, 0, '${now()}', '${now()}', '${now()}');`);
}

// Enrollments
sqls.push(`INSERT INTO "Enrollment" (id, "userId", "courseId", status, progress, "enrolledAt", "approvedAt") VALUES (${esc(cuid())}, ${esc(stu1Id)}, ${esc(c1Id)}, 'ACTIVE', 35, '${now()}', '${now()}');`);
sqls.push(`INSERT INTO "Enrollment" (id, "userId", "courseId", status, progress, grade, "enrolledAt", "approvedAt", "completedAt") VALUES (${esc(cuid())}, ${esc(stu1Id)}, ${esc(c5Id)}, 'COMPLETED', 100, 92, '${now()}', '${now()}', '${now()}');`);
sqls.push(`INSERT INTO "Enrollment" (id, "userId", "courseId", status, progress, "enrolledAt", "approvedAt") VALUES (${esc(cuid())}, ${esc(stu2Id)}, ${esc(c1Id)}, 'ACTIVE', 60, '${now()}', '${now()}');`);
sqls.push(`INSERT INTO "Enrollment" (id, "userId", "courseId", status, progress, "enrolledAt", "approvedAt") VALUES (${esc(cuid())}, ${esc(stu2Id)}, ${esc(c2Id)}, 'ACTIVE', 20, '${now()}', '${now()}');`);
sqls.push(`INSERT INTO "Enrollment" (id, "userId", "courseId", status, progress, "enrolledAt") VALUES (${esc(cuid())}, ${esc(stu3Id)}, ${esc(c5Id)}, 'ACTIVE', 50, '${now()}');`);
sqls.push(`INSERT INTO "Enrollment" (id, "userId", "courseId", status, progress, "enrolledAt") VALUES (${esc(cuid())}, ${esc(stu3Id)}, ${esc(c3Id)}, 'PENDING', 0, '${now()}');`);
sqls.push(`INSERT INTO "Enrollment" (id, "userId", "courseId", status, progress, "enrolledAt", "approvedAt") VALUES (${esc(cuid())}, ${esc(stu4Id)}, ${esc(c1Id)}, 'ACTIVE', 10, '${now()}', '${now()}');`);
sqls.push(`INSERT INTO "Enrollment" (id, "userId", "courseId", status, progress, grade, "enrolledAt", "approvedAt", "completedAt") VALUES (${esc(cuid())}, ${esc(stu5Id)}, ${esc(c5Id)}, 'COMPLETED', 100, 85, '${now()}', '${now()}', '${now()}');`);

// Payments
sqls.push(`INSERT INTO "Payment" (id, "userId", "courseId", amount, currency, status, method, "transactionId", "createdAt", "updatedAt") VALUES (${esc(cuid())}, ${esc(stu1Id)}, ${esc(c1Id)}, 29.99, 'USD', 'COMPLETED', 'STRIPE', 'sim_demo_1', '${now()}', '${now()}');`);
sqls.push(`INSERT INTO "Payment" (id, "userId", "courseId", amount, currency, status, method, "transactionId", "createdAt", "updatedAt") VALUES (${esc(cuid())}, ${esc(stu2Id)}, ${esc(c1Id)}, 29.99, 'USD', 'COMPLETED', 'STRIPE', 'sim_demo_2', '${now()}', '${now()}');`);
sqls.push(`INSERT INTO "Payment" (id, "userId", "courseId", amount, currency, status, method, "transactionId", "createdAt", "updatedAt") VALUES (${esc(cuid())}, ${esc(stu2Id)}, ${esc(c2Id)}, 39.99, 'USD', 'COMPLETED', 'STRIPE', 'sim_demo_3', '${now()}', '${now()}');`);

// Reviews
sqls.push(`INSERT INTO "Review" (id, "userId", "courseId", rating, comment, "isApproved", "createdAt", "updatedAt") VALUES (${esc(cuid())}, ${esc(stu1Id)}, ${esc(c1Id)}, 5, 'Absolutely fantastic course! Sarah explains everything clearly.', true, '${now()}', '${now()}');`);
sqls.push(`INSERT INTO "Review" (id, "userId", "courseId", rating, comment, "isApproved", "createdAt", "updatedAt") VALUES (${esc(cuid())}, ${esc(stu2Id)}, ${esc(c1Id)}, 4, 'Great course with solid content. Highly recommended.', true, '${now()}', '${now()}');`);
sqls.push(`INSERT INTO "Review" (id, "userId", "courseId", rating, comment, "isApproved", "createdAt", "updatedAt") VALUES (${esc(cuid())}, ${esc(stu1Id)}, ${esc(c5Id)}, 5, 'Perfect intro to JavaScript!', true, '${now()}', '${now()}');`);
sqls.push(`INSERT INTO "Review" (id, "userId", "courseId", rating, comment, "isApproved", "createdAt", "updatedAt") VALUES (${esc(cuid())}, ${esc(stu5Id)}, ${esc(c5Id)}, 4, 'Good starting point for learning JavaScript.', true, '${now()}', '${now()}');`);

// Certificates
sqls.push(`INSERT INTO "Certificate" (id, "userId", "courseId", "certificateId", grade, "issuedAt", "templateStyle") VALUES (${esc(cuid())}, ${esc(stu1Id)}, ${esc(c5Id)}, 'EF-DEMO-ABC123', 92, '${now()}', 'classic');`);
sqls.push(`INSERT INTO "Certificate" (id, "userId", "courseId", "certificateId", grade, "issuedAt", "templateStyle") VALUES (${esc(cuid())}, ${esc(stu5Id)}, ${esc(c5Id)}, 'EF-DEMO-DEF456', 85, '${now()}', 'classic');`);

// Quiz
const q1Id = cuid();
sqls.push(`INSERT INTO "Quiz" (id, title, description, "courseId", "timeLimit", "passingScore", "maxAttempts", "order", "isActive", "createdAt") VALUES (${esc(q1Id)}, 'React Core Concepts Quiz', 'Test your React fundamentals', ${esc(c1Id)}, 15, 70, 3, 1, true, '${now()}');`);

const questions = [
  ["What is JSX?", "MULTIPLE_CHOICE", '["A templating language","A JavaScript syntax extension","A CSS framework","A testing library"]', "A JavaScript syntax extension", "JSX is a syntax extension for JavaScript."],
  ["React components must return a single root element.", "TRUE_FALSE", '["True","False"]', "True", "Use Fragments to group elements."],
  ["Which hook is used for side effects?", "MULTIPLE_CHOICE", '["useState","useEffect","useContext","useReducer"]', "useEffect", "useEffect handles side effects."],
  ["Purpose of key prop in lists?", "MULTIPLE_CHOICE", '["Styling","Unique identification","Event handling","Data binding"]', "Unique identification", null],
  ["State updates are asynchronous.", "TRUE_FALSE", '["True","False"]', "True", null],
];
questions.forEach((q, i) => {
  sqls.push(`INSERT INTO "Question" (id, "quizId", text, type, options, "correctAnswer", points, "order", explanation) VALUES (${esc(cuid())}, ${esc(q1Id)}, ${esc(q[0])}, ${esc(q[1])}, ${esc(q[2])}, ${esc(q[3])}, 1, ${i + 1}, ${esc(q[4])});`);
});

// Achievements
const achIds = Array.from({ length: 10 }, () => cuid());
const achs = [
  ["First Steps", "Complete your first lesson", "target", 10, '{"type":"lessons_completed","count":1}', "BRONZE"],
  ["Quick Learner", "Complete 10 lessons", "zap", 25, '{"type":"lessons_completed","count":10}', "BRONZE"],
  ["Course Completer", "Complete your first course", "graduation-cap", 50, '{"type":"courses_completed","count":1}', "SILVER"],
  ["Quiz Master", "Score 100% on any quiz", "trophy", 30, '{"type":"quiz_perfect","count":1}', "SILVER"],
  ["Knowledge Seeker", "Enroll in 5 courses", "book-open", 40, '{"type":"enrollments","count":5}', "SILVER"],
  ["Certified Pro", "Earn 3 certificates", "award", 100, '{"type":"certificates","count":3}', "GOLD"],
  ["Community Leader", "Create 10 discussion posts", "message-square", 30, '{"type":"discussions","count":10}', "BRONZE"],
  ["Dedicated Learner", "Complete 50 lessons", "flame", 75, '{"type":"lessons_completed","count":50}', "GOLD"],
  ["Elite Scholar", "Reach Level 10", "crown", 200, '{"type":"level","count":10}', "PLATINUM"],
  ["Review Hero", "Write 5 course reviews", "star", 20, '{"type":"reviews","count":5}', "BRONZE"],
];
achs.forEach((a, i) => {
  sqls.push(`INSERT INTO "Achievement" (id, name, description, icon, "xpReward", criteria, tier) VALUES (${esc(achIds[i])}, ${esc(a[0])}, ${esc(a[1])}, ${esc(a[2])}, ${a[3]}, ${esc(a[4])}, ${esc(a[5])});`);
});

sqls.push(`INSERT INTO "UserAchievement" (id, "userId", "achievementId", "earnedAt") VALUES (${esc(cuid())}, ${esc(stu1Id)}, ${esc(achIds[0])}, '${now()}');`);
sqls.push(`INSERT INTO "UserAchievement" (id, "userId", "achievementId", "earnedAt") VALUES (${esc(cuid())}, ${esc(stu1Id)}, ${esc(achIds[1])}, '${now()}');`);
sqls.push(`INSERT INTO "UserAchievement" (id, "userId", "achievementId", "earnedAt") VALUES (${esc(cuid())}, ${esc(stu1Id)}, ${esc(achIds[2])}, '${now()}');`);
sqls.push(`INSERT INTO "UserAchievement" (id, "userId", "achievementId", "earnedAt") VALUES (${esc(cuid())}, ${esc(stu2Id)}, ${esc(achIds[0])}, '${now()}');`);
sqls.push(`INSERT INTO "UserAchievement" (id, "userId", "achievementId", "earnedAt") VALUES (${esc(cuid())}, ${esc(stu5Id)}, ${esc(achIds[0])}, '${now()}');`);
sqls.push(`INSERT INTO "UserAchievement" (id, "userId", "achievementId", "earnedAt") VALUES (${esc(cuid())}, ${esc(stu5Id)}, ${esc(achIds[2])}, '${now()}');`);

// Discussion
const disc1Id = cuid();
sqls.push(`INSERT INTO "Discussion" (id, title, content, "userId", "courseId", "isPinned", "isResolved", "createdAt", "updatedAt") VALUES (${esc(disc1Id)}, 'How to structure a large React project?', 'I am working on a larger project and not sure how to organize my files and folders. Any suggestions?', ${esc(stu1Id)}, ${esc(c1Id)}, true, false, '${now()}', '${now()}');`);
sqls.push(`INSERT INTO "Comment" (id, content, "userId", "discussionId", "isAnswer", "createdAt", "updatedAt") VALUES (${esc(cuid())}, 'Great question! I recommend a feature-based folder structure.', ${esc(inst1Id)}, ${esc(disc1Id)}, true, '${now()}', '${now()}');`);
sqls.push(`INSERT INTO "Comment" (id, content, "userId", "discussionId", "isAnswer", "createdAt", "updatedAt") VALUES (${esc(cuid())}, 'Same approach works really well at scale!', ${esc(stu2Id)}, ${esc(disc1Id)}, false, '${now()}', '${now()}');`);

// Live Sessions
const tomorrow = new Date(Date.now() + 86400000).toISOString();
const in3days = new Date(Date.now() + 3 * 86400000).toISOString();
sqls.push(`INSERT INTO "LiveSession" (id, title, description, "courseId", "startTime", duration, "roomId", status, "maxParticipants", "createdAt") VALUES (${esc(cuid())}, 'React Q&A Session', 'Live Q&A covering React best practices.', ${esc(c1Id)}, '${tomorrow}', 60, ${esc(cuid())}, 'SCHEDULED', 50, '${now()}');`);
sqls.push(`INSERT INTO "LiveSession" (id, title, description, "courseId", "startTime", duration, "roomId", status, "maxParticipants", "createdAt") VALUES (${esc(cuid())}, 'Building a Real-time Chat App', 'Live coding session building a chat app.', ${esc(c1Id)}, '${in3days}', 90, ${esc(cuid())}, 'SCHEDULED', 100, '${now()}');`);

// Coupons
const in30d = new Date(Date.now() + 30 * 86400000).toISOString();
sqls.push(`INSERT INTO "Coupon" (id, code, discount, "maxUses", "usedCount", "validFrom", "validUntil", "isActive") VALUES (${esc(cuid())}, 'WELCOME20', 20, 1000, 0, '${now()}', '${in30d}', true);`);
sqls.push(`INSERT INTO "Coupon" (id, code, discount, "maxUses", "usedCount", "validFrom", "validUntil", "isActive", "courseId") VALUES (${esc(cuid())}, 'REACT50', 50, 100, 0, '${now()}', '${in30d}', true, ${esc(c1Id)});`);

// Notifications
sqls.push(`INSERT INTO "Notification" (id, "userId", title, message, type, link, "isRead", "createdAt") VALUES (${esc(cuid())}, ${esc(stu1Id)}, 'Welcome to EduFlow!', 'Start exploring our courses and begin learning.', 'SUCCESS', '/courses', false, '${now()}');`);
sqls.push(`INSERT INTO "Notification" (id, "userId", title, message, type, link, "isRead", "createdAt") VALUES (${esc(cuid())}, ${esc(stu1Id)}, 'Course Progress', 'You are 35% through React & Next.js Developer Course.', 'INFO', '/dashboard/courses', false, '${now()}');`);
sqls.push(`INSERT INTO "Notification" (id, "userId", title, message, type, link, "isRead", "createdAt") VALUES (${esc(cuid())}, ${esc(stu1Id)}, 'Certificate Earned!', 'You earned a certificate for JavaScript Fundamentals!', 'ACHIEVEMENT', '/dashboard/certificates', false, '${now()}');`);

// Site Settings
sqls.push(`INSERT INTO "SiteSetting" (id, key, value) VALUES (${esc(cuid())}, 'siteName', 'EduFlow');`);
sqls.push(`INSERT INTO "SiteSetting" (id, key, value) VALUES (${esc(cuid())}, 'siteDescription', 'Online Learning Platform');`);
sqls.push(`INSERT INTO "SiteSetting" (id, key, value) VALUES (${esc(cuid())}, 'maintenanceMode', 'false');`);
sqls.push(`INSERT INTO "SiteSetting" (id, key, value) VALUES (${esc(cuid())}, 'allowRegistration', 'true');`);

// Announcement
sqls.push(`INSERT INTO "Announcement" (id, title, content, "userId", "createdAt") VALUES (${esc(cuid())}, 'Welcome to EduFlow!', 'We are excited to launch our new learning platform. Explore our courses and start learning today!', ${esc(adminId)}, '${now()}');`);

// Execute via psql
const fullSql = sqls.join("\n");
const directUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

try {
  execSync(`PGPASSWORD='EduFlow2026Secure!' psql -h aws-1-us-east-1.pooler.supabase.com -p 5432 -U postgres.vuccbkuwaqxbogwzsekr -d postgres`, {
    input: fullSql,
    stdio: ["pipe", "pipe", "pipe"],
  });
  console.log("\n✅ Database seeded successfully!\n");
  console.log("Demo Accounts:");
  console.log("  Admin:      admin@eduflow.com / password123");
  console.log("  Instructor: instructor@eduflow.com / password123");
  console.log("  Student:    student@eduflow.com / password123");
  console.log("\n  All passwords: password123");
} catch (err) {
  console.error("Seed failed:", err.stderr?.toString() || err.message);
  process.exit(1);
}
