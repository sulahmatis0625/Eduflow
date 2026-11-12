// Seed script for EduFlow - generates SQL and runs via psql
import { randomBytes } from "crypto";
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
const c1Id = cuid(), c2Id = cuid(), c3Id = cuid(), c4Id = cuid(), c5Id = cuid(), c6Id = cuid(), c7Id = cuid();

const thumbReact = "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80";
const thumbPython = "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80";
const thumbDesign = "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80";
const thumbDocker = "https://images.unsplash.com/photo-1605745341112-85968b19335b?w=800&q=80";
const feThumb = "https://i.ytimg.com/vi/9He4UBLyk8Y/hqdefault.jpg";
const fePreview = "https://www.youtube.com/watch?v=9He4UBLyk8Y";
const thumbMobile = "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&q=80";
const thumbHtml = "https://i.ytimg.com/vi/qz0aGYrrlhU/hqdefault.jpg";
const htmlPreview = "https://www.youtube.com/watch?v=qz0aGYrrlhU";

sqls.push(`INSERT INTO "Course" (id, title, slug, description, "shortDescription", price, "discountPrice", level, status, "isFeatured", "isFree", duration, "totalLessons", "passingGrade", "certificateEnabled", tags, requirements, "whatYouLearn", "targetAudience", "categoryId", "instructorId", currency, language, thumbnail, "createdAt", "updatedAt") VALUES (${esc(c1Id)}, 'Complete React & Next.js Developer Course', 'complete-react-nextjs-developer', 'Master React and Next.js from scratch. Build full-stack applications with the latest features including server components, app router, and more.', 'Master React and Next.js from scratch.', 5500, 4500, 'BEGINNER', 'PUBLISHED', true, false, 1200, 48, 50, true, 'react,nextjs,javascript,typescript', 'Basic HTML/CSS knowledge,A computer with internet', 'Build React apps from scratch,Master Next.js App Router,Implement authentication,Deploy to production', 'Beginners,Developers transitioning to Next.js', ${esc(catIds[0])}, ${esc(inst1Id)}, 'ETB', 'English', ${esc(thumbReact)}, '${now()}', '${now()}');`);

sqls.push(`INSERT INTO "Course" (id, title, slug, description, "shortDescription", price, "discountPrice", level, status, "isFeatured", "isFree", duration, "totalLessons", "passingGrade", "certificateEnabled", tags, "categoryId", "instructorId", currency, language, thumbnail, "createdAt", "updatedAt") VALUES (${esc(c2Id)}, 'Python for Data Science & Machine Learning', 'python-data-science-ml', 'Learn Python, data analysis with Pandas, and machine learning with Scikit-learn and TensorFlow.', 'Learn Python, data analysis, and ML.', 6500, 5200, 'INTERMEDIATE', 'PUBLISHED', true, false, 960, 36, 50, true, 'python,data-science,ml', ${esc(catIds[1])}, ${esc(inst2Id)}, 'ETB', 'English', ${esc(thumbPython)}, '${now()}', '${now()}');`);

sqls.push(`INSERT INTO "Course" (id, title, slug, description, "shortDescription", price, level, status, "isFeatured", "isFree", duration, "totalLessons", "passingGrade", "certificateEnabled", tags, "categoryId", "instructorId", currency, language, thumbnail, "createdAt", "updatedAt") VALUES (${esc(c3Id)}, 'UI/UX Design Masterclass', 'uiux-design-masterclass', 'Complete UI/UX design course covering user research, wireframing, prototyping, and Figma.', 'Master UI/UX design and Figma.', 3800, 'BEGINNER', 'PUBLISHED', true, false, 720, 30, 50, true, 'design,uiux,figma', ${esc(catIds[3])}, ${esc(inst3Id)}, 'ETB', 'English', ${esc(thumbDesign)}, '${now()}', '${now()}');`);

sqls.push(`INSERT INTO "Course" (id, title, slug, description, "shortDescription", price, "discountPrice", level, status, "isFeatured", "isFree", duration, "totalLessons", "passingGrade", "certificateEnabled", tags, "categoryId", "instructorId", currency, language, thumbnail, "createdAt", "updatedAt") VALUES (${esc(c4Id)}, 'Docker & Kubernetes Complete Guide', 'docker-kubernetes-complete', 'Master containerization with Docker and orchestration with Kubernetes for production deployments.', 'Master Docker and Kubernetes.', 7200, 5800, 'ADVANCED', 'PUBLISHED', false, false, 840, 32, 50, true, 'docker,kubernetes,devops', ${esc(catIds[4])}, ${esc(inst1Id)}, 'ETB', 'English', ${esc(thumbDocker)}, '${now()}', '${now()}');`);

// Real YouTube playlist course — Front End Developer Learning Path (22 lessons / 5 chapters)
sqls.push(`INSERT INTO "Course" (id, title, slug, description, "shortDescription", price, level, status, "isFeatured", "isFree", duration, "totalLessons", "passingGrade", "certificateEnabled", tags, requirements, "whatYouLearn", "targetAudience", "categoryId", "instructorId", currency, language, thumbnail, "previewVideo", "createdAt", "updatedAt") VALUES (${esc(c5Id)}, 'Front End Developer Learning Path', 'front-end-developer-learning-path', 'A complete freeCodeCamp front-end path: HTML, CSS, JavaScript, React, Next.js, TypeScript, testing, and more — 22 video lessons across 5 chapters.', '22 freeCodeCamp lessons in 5 chapters — watch on EduFlow.', 8000, 'BEGINNER', 'PUBLISHED', true, false, 4500, 22, 50, true, 'html,css,javascript,react,frontend', 'A computer with internet,Willingness to practice', 'Build websites with HTML/CSS/JS,Learn React and Next.js,Use Git, TypeScript, and testing tools', 'Absolute beginners and aspiring front-end developers', ${esc(catIds[0])}, ${esc(inst1Id)}, 'ETB', 'English', ${esc(feThumb)}, ${esc(fePreview)}, '${now()}', '${now()}');`);

sqls.push(`INSERT INTO "Course" (id, title, slug, description, "shortDescription", price, level, status, "isFeatured", "isFree", duration, "totalLessons", "passingGrade", "certificateEnabled", tags, "categoryId", "instructorId", currency, language, thumbnail, "createdAt", "updatedAt") VALUES (${esc(c6Id)}, 'Mobile App Development with React Native', 'mobile-app-react-native', 'Build cross-platform mobile apps with React Native and Expo.', 'Build mobile apps with React Native.', 4800, 'INTERMEDIATE', 'PUBLISHED', false, false, 780, 28, 50, true, 'react-native,mobile', ${esc(catIds[2])}, ${esc(inst1Id)}, 'ETB', 'English', ${esc(thumbMobile)}, '${now()}', '${now()}');`);

// Free trial course — HTML Tutorial for Beginners (Mosh)
sqls.push(`INSERT INTO "Course" (id, title, slug, description, "shortDescription", price, level, status, "isFeatured", "isFree", duration, "totalLessons", "passingGrade", "certificateEnabled", tags, requirements, "whatYouLearn", "targetAudience", "categoryId", "instructorId", currency, language, thumbnail, "previewVideo", "createdAt", "updatedAt") VALUES (${esc(c7Id)}, 'HTML Tutorial for Beginners', 'html-tutorial-for-beginners', 'A free beginner HTML crash course to get you started on EduFlow. Watch the full tutorial, mark the lesson complete, and earn your first certificate.', 'Free HTML crash course — your free trial starter.', 0, 'BEGINNER', 'PUBLISHED', true, true, 60, 1, 50, true, 'html,beginner,free,trial', 'A computer with internet', 'Write your first HTML page,Understand basic web structure,Start your learning journey on EduFlow', 'Absolute beginners starting a free trial', ${esc(catIds[0])}, ${esc(inst1Id)}, 'ETB', 'English', ${esc(thumbHtml)}, ${esc(htmlPreview)}, '${now()}', '${now()}');`);

const htmlSecId = cuid();
sqls.push(`INSERT INTO "Section" (id, title, "order", "courseId", "createdAt") VALUES (${esc(htmlSecId)}, 'Getting Started with HTML', 1, ${esc(c7Id)}, '${now()}');`);
sqls.push(`INSERT INTO "Lesson" (id, title, type, duration, "order", "isFree", "isPreview", "sectionId", "videoUrl", "createdAt", "updatedAt") VALUES (${esc(cuid())}, 'HTML Crash Course for Beginners', 'VIDEO', 60, 1, true, true, ${esc(htmlSecId)}, ${esc(htmlPreview)}, '${now()}', '${now()}');`);

// Sections & Lessons for Course 1
const sectionData = [
  {
    title: "Getting Started", order: 1, lessons: [
      ["Course Introduction", "VIDEO", 10, 1, true, true],
      ["Setting Up Your Dev Environment", "VIDEO", 15, 2, true, false],
      ["Understanding React Fundamentals", "TEXT", 20, 3, false, false],
      ["Your First React Component", "VIDEO", 25, 4, false, false],
    ]
  },
  {
    title: "React Core Concepts", order: 2, lessons: [
      ["JSX Deep Dive", "VIDEO", 20, 1, false, false],
      ["Props and State", "VIDEO", 30, 2, false, false],
      ["Event Handling", "VIDEO", 18, 3, false, false],
      ["Conditional Rendering", "VIDEO", 15, 4, false, false],
      ["Lists and Keys", "VIDEO", 22, 5, false, false],
    ]
  },
  {
    title: "React Hooks", order: 3, lessons: [
      ["useState and useEffect", "VIDEO", 35, 1, false, false],
      ["useContext", "VIDEO", 25, 2, false, false],
      ["Custom Hooks", "VIDEO", 28, 3, false, false],
    ]
  },
  {
    title: "Next.js Fundamentals", order: 4, lessons: [
      ["Introduction to Next.js", "VIDEO", 15, 1, false, false],
      ["File-based Routing", "VIDEO", 25, 2, false, false],
      ["Server vs Client Components", "VIDEO", 30, 3, false, false],
      ["Data Fetching", "VIDEO", 35, 4, false, false],
    ]
  },
  {
    title: "Building a Full-Stack App", order: 5, lessons: [
      ["Project Setup", "VIDEO", 30, 1, false, false],
      ["Authentication", "VIDEO", 40, 2, false, false],
      ["CRUD Operations", "VIDEO", 35, 3, false, false],
      ["Deployment", "VIDEO", 20, 4, false, false],
    ]
  },
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

// Course 5 — Front End path from YouTube playlist PLWKjhJtqVAbmMuZ3saqRIBimAKIMYkt0E (22 lessons → 5 chapters)
// lesson: [title, youtubeId, durationSec, order]
const frontendChapters = [
  {
    title: "Chapter 1 — Foundations",
    order: 1,
    lessons: [
      ["Front End Developer Roadmap", "9He4UBLyk8Y", 729, 1],
      ["HTML Tutorial - Website Crash Course for Beginners", "916GWv2Qs08", 2720, 2],
      ["CSS Tutorial – Full Course for Beginners", "OXGznpKZ_sA", 40090, 3],
      ["Visual Studio Code Crash Course", "WPqXP_kLzpo", 5555, 4],
    ],
  },
  {
    title: "Chapter 2 — JavaScript & First Builds",
    order: 2,
    lessons: [
      ["JavaScript Programming - Full Course", "jS4aFq5-91M", 27860, 1],
      ["Prompt Engineering Tutorial – Master ChatGPT and LLM Responses", "_ZvnD73m40o", 2496, 2],
      ["Build a Simple Website with HTML, CSS, JavaScript", "krfUjg0S2uI", 25950, 3],
      ["Web App Tutorial - JavaScript, Mobile First, Accessibility", "y51Cv4wnsPw", 7287, 4],
    ],
  },
  {
    title: "Chapter 3 — Tools, Frameworks & React",
    order: 3,
    lessons: [
      ["Git and GitHub for Beginners - Crash Course", "RGOj5yH7evk", 4110, 1],
      ["Learn Bootstrap 5 and SASS by Building a Portfolio Website", "iJKCj8uAHz8", 18143, 2],
      ["Learn React 18 with Redux Toolkit – Full Tutorial", "2-crBg6wpp0", 51103, 3],
      ["Learn Tailwind CSS – Course for Beginners", "ft30zcMlFao", 15138, 4],
    ],
  },
  {
    title: "Chapter 4 — Testing, TypeScript & APIs",
    order: 4,
    lessons: [
      ["Learn Vite – Frontend Build Tool Course", "VAeRhmpcWEQ", 5462, 1],
      ["Testing JavaScript with Cypress – Full Course", "u8vMu7viCm8", 9573, 2],
      ["React Testing Course for Beginners", "8vfQ6SWBZ-U", 7461, 3],
      ["Learn TypeScript – Full Tutorial", "30LWjhZzg50", 17185, 4],
      ["GraphQL Course for Beginners", "5199E50O7SI", 5340, 5],
    ],
  },
  {
    title: "Chapter 5 — Modern Frameworks & Security",
    order: 5,
    lessons: [
      ["Next.js React Framework Course – Full Stack App", "KjY94sAKLlw", 17257, 1],
      ["React Native Course – Android and iOS App Development", "obH0Po_RdWk", 16839, 2],
      ["Astro Web Framework Crash Course", "e-hTm5VmofI", 4608, 3],
      ["OWASP API Security Top 10 Course", "YYe0FdfdgDU", 5221, 4],
      ["How does the internet work? (Full Course)", "zN8YNNHcaZc", 6163, 5],
    ],
  },
];

for (const chapter of frontendChapters) {
  const secId = cuid();
  sqls.push(`INSERT INTO "Section" (id, title, "order", "courseId", "createdAt") VALUES (${esc(secId)}, ${esc(chapter.title)}, ${chapter.order}, ${esc(c5Id)}, '${now()}');`);
  for (const les of chapter.lessons) {
    const lesId = cuid();
    const durationMin = Math.max(1, Math.round(les[2] / 60));
    const videoUrl = `https://www.youtube.com/watch?v=${les[1]}`;
    const isPreview = chapter.order === 1 && les[3] === 1;
    sqls.push(`INSERT INTO "Lesson" (id, title, type, duration, "order", "isFree", "isPreview", "sectionId", "videoUrl", "createdAt", "updatedAt") VALUES (${esc(lesId)}, ${esc(les[0])}, 'VIDEO', ${durationMin}, ${les[3]}, true, ${isPreview}, ${esc(secId)}, ${esc(videoUrl)}, '${now()}', '${now()}');`);
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
sqls.push(`INSERT INTO "Enrollment" (id, "userId", "courseId", status, progress, "enrolledAt", "approvedAt") VALUES (${esc(cuid())}, ${esc(stu1Id)}, ${esc(c5Id)}, 'ACTIVE', 5, '${now()}', '${now()}');`);
sqls.push(`INSERT INTO "Enrollment" (id, "userId", "courseId", status, progress, "enrolledAt", "approvedAt") VALUES (${esc(cuid())}, ${esc(stu2Id)}, ${esc(c1Id)}, 'ACTIVE', 60, '${now()}', '${now()}');`);
sqls.push(`INSERT INTO "Enrollment" (id, "userId", "courseId", status, progress, "enrolledAt", "approvedAt") VALUES (${esc(cuid())}, ${esc(stu2Id)}, ${esc(c2Id)}, 'ACTIVE', 20, '${now()}', '${now()}');`);
sqls.push(`INSERT INTO "Enrollment" (id, "userId", "courseId", status, progress, "enrolledAt") VALUES (${esc(cuid())}, ${esc(stu3Id)}, ${esc(c5Id)}, 'ACTIVE', 50, '${now()}');`);
sqls.push(`INSERT INTO "Enrollment" (id, "userId", "courseId", status, progress, "enrolledAt") VALUES (${esc(cuid())}, ${esc(stu3Id)}, ${esc(c3Id)}, 'PENDING', 0, '${now()}');`);
sqls.push(`INSERT INTO "Enrollment" (id, "userId", "courseId", status, progress, "enrolledAt", "approvedAt") VALUES (${esc(cuid())}, ${esc(stu4Id)}, ${esc(c1Id)}, 'ACTIVE', 10, '${now()}', '${now()}');`);
sqls.push(`INSERT INTO "Enrollment" (id, "userId", "courseId", status, progress, grade, "enrolledAt", "approvedAt", "completedAt") VALUES (${esc(cuid())}, ${esc(stu5Id)}, ${esc(c5Id)}, 'COMPLETED', 100, 85, '${now()}', '${now()}', '${now()}');`);

// Payments
sqls.push(`INSERT INTO "Payment" (id, "userId", "courseId", amount, currency, status, method, "transactionId", "createdAt", "updatedAt") VALUES (${esc(cuid())}, ${esc(stu1Id)}, ${esc(c1Id)}, 4500, 'ETB', 'COMPLETED', 'STRIPE', 'sim_demo_1', '${now()}', '${now()}');`);
sqls.push(`INSERT INTO "Payment" (id, "userId", "courseId", amount, currency, status, method, "transactionId", "createdAt", "updatedAt") VALUES (${esc(cuid())}, ${esc(stu2Id)}, ${esc(c1Id)}, 4500, 'ETB', 'COMPLETED', 'STRIPE', 'sim_demo_2', '${now()}', '${now()}');`);
sqls.push(`INSERT INTO "Payment" (id, "userId", "courseId", amount, currency, status, method, "transactionId", "createdAt", "updatedAt") VALUES (${esc(cuid())}, ${esc(stu2Id)}, ${esc(c2Id)}, 5200, 'ETB', 'COMPLETED', 'STRIPE', 'sim_demo_3', '${now()}', '${now()}');`);// Reviews
sqls.push(`INSERT INTO "Review" (id, "userId", "courseId", rating, comment, "isApproved", "createdAt", "updatedAt") VALUES (${esc(cuid())}, ${esc(stu1Id)}, ${esc(c1Id)}, 5, 'Absolutely fantastic course! Sarah explains everything clearly.', true, '${now()}', '${now()}');`);
sqls.push(`INSERT INTO "Review" (id, "userId", "courseId", rating, comment, "isApproved", "createdAt", "updatedAt") VALUES (${esc(cuid())}, ${esc(stu2Id)}, ${esc(c1Id)}, 4, 'Great course with solid content. Highly recommended.', true, '${now()}', '${now()}');`);
sqls.push(`INSERT INTO "Review" (id, "userId", "courseId", rating, comment, "isApproved", "createdAt", "updatedAt") VALUES (${esc(cuid())}, ${esc(stu1Id)}, ${esc(c5Id)}, 5, 'Amazing freeCodeCamp path — love having all videos in one course!', true, '${now()}', '${now()}');`);
sqls.push(`INSERT INTO "Review" (id, "userId", "courseId", rating, comment, "isApproved", "createdAt", "updatedAt") VALUES (${esc(cuid())}, ${esc(stu5Id)}, ${esc(c5Id)}, 4, 'Great structured front-end learning path.', true, '${now()}', '${now()}');`);

// Certificates
sqls.push(`INSERT INTO "Certificate" (id, "userId", "courseId", "certificateId", grade, "issuedAt", "templateStyle") VALUES (${esc(cuid())}, ${esc(stu5Id)}, ${esc(c5Id)}, 'EF-DEMO-DEF456', 85, '${now()}', 'classic');`);

// Quizzes for Course 1 — one per chapter (section order) + final exam
// order 1..5 = chapter quizzes, order 6 = final exam
const quizSeeds = [
  {
    title: "Getting Started Quiz",
    description: "Check your setup and React basics before moving on.",
    timeLimit: 10,
    passingScore: 50,
    maxAttempts: 3,
    order: 1,
    questions: [
      ["What command creates a new Next.js app?", "MULTIPLE_CHOICE", '["npx create-react-app","npx create-next-app","npm init next","yarn new-next"]', "npx create-next-app", "create-next-app is the official Next.js starter."],
      ["React is a library for building user interfaces.", "TRUE_FALSE", '["True","False"]', "True", "React focuses on the view layer / UI."],
      ["Which file is typically the entry component in a React app?", "MULTIPLE_CHOICE", '["index.html","App.jsx or page.tsx","styles.css","package.json"]', "App.jsx or page.tsx", "Components live in JS/TSX files like App or page."],
      ["You need Node.js installed to run a local React/Next.js project.", "TRUE_FALSE", '["True","False"]', "True", "npm/npx require Node.js."],
      ["What does a React component return?", "MULTIPLE_CHOICE", '["A database row","UI described with JSX","A CSS stylesheet","A server process"]', "UI described with JSX", "Components describe what to render."],
    ],
  },
  {
    title: "React Core Concepts Quiz",
    description: "Test JSX, props, state, events, and lists.",
    timeLimit: 15,
    passingScore: 50,
    maxAttempts: 3,
    order: 2,
    questions: [
      ["What is JSX?", "MULTIPLE_CHOICE", '["A templating language","A JavaScript syntax extension","A CSS framework","A testing library"]', "A JavaScript syntax extension", "JSX is a syntax extension for JavaScript."],
      ["React components must return a single root element (or a Fragment).", "TRUE_FALSE", '["True","False"]', "True", "Use Fragments to group elements without an extra DOM node."],
      ["Props are used to pass data from parent to child.", "TRUE_FALSE", '["True","False"]', "True", "Props flow downward from parent to child."],
      ["Purpose of the key prop in lists?", "MULTIPLE_CHOICE", '["Styling","Unique identification","Event handling","Data binding"]', "Unique identification", "Keys help React identify which items changed."],
      ["State updates in React are asynchronous.", "TRUE_FALSE", '["True","False"]', "True", "Updates may be batched; do not rely on immediate reads."],
      ["Which is the correct way to handle a button click?", "MULTIPLE_CHOICE", '["onclick=\\"doSomething()\\"","onClick={doSomething}","onPress={doSomething}","click={doSomething}"]', "onClick={doSomething}", "React uses camelCase event props like onClick."],
    ],
  },
  {
    title: "React Hooks Quiz",
    description: "Validate your understanding of useState, useEffect, and custom hooks.",
    timeLimit: 15,
    passingScore: 50,
    maxAttempts: 3,
    order: 3,
    questions: [
      ["Which hook is used for side effects?", "MULTIPLE_CHOICE", '["useState","useEffect","useContext","useReducer"]', "useEffect", "useEffect runs side effects after render."],
      ["useState returns the current state and a setter function.", "TRUE_FALSE", '["True","False"]', "True", "const [value, setValue] = useState(initial)."],
      ["useEffect with an empty dependency array runs once after mount.", "TRUE_FALSE", '["True","False"]', "True", "[] means run on mount (and cleanup on unmount)."],
      ["Which hook shares data across a component tree without prop drilling?", "MULTIPLE_CHOICE", '["useRef","useMemo","useContext","useId"]', "useContext", "Context + useContext avoids deep prop passing."],
      ["Custom hooks must start with the word \"use\".", "TRUE_FALSE", '["True","False"]', "True", "The use* naming convention enables the Rules of Hooks."],
      ["Calling hooks inside loops or conditions is recommended.", "TRUE_FALSE", '["True","False"]', "False", "Hooks must be called at the top level of a component/custom hook."],
    ],
  },
  {
    title: "Next.js Fundamentals Quiz",
    description: "Routing, Server/Client Components, and data fetching.",
    timeLimit: 15,
    passingScore: 50,
    maxAttempts: 3,
    order: 4,
    questions: [
      ["Next.js App Router uses folders and page files for routes.", "TRUE_FALSE", '["True","False"]', "True", "File-based routing maps folders to URLs."],
      ["By default, components in the App Router are Server Components.", "TRUE_FALSE", '["True","False"]', "True", "Add use client when you need client interactivity."],
      ["Which directive marks a Client Component?", "MULTIPLE_CHOICE", '["use server","use client","use strict","use browser"]', "use client", "use client opts the file into the client bundle."],
      ["Where do you typically put a route page in App Router?", "MULTIPLE_CHOICE", '["pages/index.js only","app/page.tsx","public/page.html","components/route.tsx"]', "app/page.tsx", "app/page.tsx is the root route in App Router."],
      ["Server Components can fetch data directly with async/await.", "TRUE_FALSE", '["True","False"]', "True", "Server Components support async data fetching on the server."],
    ],
  },
  {
    title: "Full-Stack App Quiz",
    description: "Auth, CRUD, and deployment basics for your project.",
    timeLimit: 15,
    passingScore: 50,
    maxAttempts: 3,
    order: 5,
    questions: [
      ["CRUD stands for Create, Read, Update, Delete.", "TRUE_FALSE", '["True","False"]', "True", "These are the four basic data operations."],
      ["Authentication proves who a user is; authorization decides what they can do.", "TRUE_FALSE", '["True","False"]', "True", "AuthN = identity, AuthZ = permissions."],
      ["Which is a common place to deploy a Next.js app?", "MULTIPLE_CHOICE", '["Only on a USB drive","Vercel","MS Paint","Photoshop"]', "Vercel", "Vercel is a common host for Next.js."],
      ["API routes / Route Handlers run on the server.", "TRUE_FALSE", '["True","False"]', "True", "They handle backend logic securely on the server."],
      ["Environment secrets like DATABASE_URL should be committed to Git.", "TRUE_FALSE", '["True","False"]', "False", "Keep secrets in .env and out of version control."],
    ],
  },
  {
    title: "Final Exam — React & Next.js",
    description: "Comprehensive exam covering the full course. Pass to complete.",
    timeLimit: 30,
    passingScore: 50,
    maxAttempts: 2,
    order: 6,
    questions: [
      ["What is JSX?", "MULTIPLE_CHOICE", '["A CSS preprocessor","A JavaScript syntax extension","A database","A Node package manager"]', "A JavaScript syntax extension", null],
      ["Which hook manages local component state?", "MULTIPLE_CHOICE", '["useEffect","useState","useRouter","usePathname"]', "useState", null],
      ["Props should be mutated directly by the child component.", "TRUE_FALSE", '["True","False"]', "False", "Treat props as read-only; lift state or use callbacks."],
      ["use client is required for components that use useState in the App Router.", "TRUE_FALSE", '["True","False"]', "True", "Client hooks need a Client Component boundary."],
      ["Purpose of keys in a mapped list?", "MULTIPLE_CHOICE", '["Make CSS work","Help React reconcile list items","Encrypt data","Replace useEffect"]', "Help React reconcile list items", null],
      ["useEffect cleanup runs when the component unmounts or before re-running the effect.", "TRUE_FALSE", '["True","False"]', "True", "Return a cleanup function from useEffect."],
      ["Next.js file-based routing means URLs map to the filesystem.", "TRUE_FALSE", '["True","False"]', "True", null],
      ["Which best describes a Server Component benefit?", "MULTIPLE_CHOICE", '["More client JavaScript always","Keep data fetching and secrets on the server","Disables CSS","Removes the need for HTML"]', "Keep data fetching and secrets on the server", null],
      ["Passing a password in a public GitHub repo is safe if the repo is for school.", "TRUE_FALSE", '["True","False"]', "False", "Never commit secrets."],
      ["A passing final exam typically unlocks course completion / certificate eligibility.", "TRUE_FALSE", '["True","False"]', "True", "In EduFlow, the final exam gates full course completion."],
    ],
  },
];

for (const quiz of quizSeeds) {
  const quizId = cuid();
  sqls.push(`INSERT INTO "Quiz" (id, title, description, "courseId", "timeLimit", "passingScore", "maxAttempts", "order", "isActive", "createdAt") VALUES (${esc(quizId)}, ${esc(quiz.title)}, ${esc(quiz.description)}, ${esc(c1Id)}, ${quiz.timeLimit}, ${quiz.passingScore}, ${quiz.maxAttempts}, ${quiz.order}, true, '${now()}');`);
  quiz.questions.forEach((q, i) => {
    sqls.push(`INSERT INTO "Question" (id, "quizId", text, type, options, "correctAnswer", points, "order", explanation) VALUES (${esc(cuid())}, ${esc(quizId)}, ${esc(q[0])}, ${esc(q[1])}, ${esc(q[2])}, ${esc(q[3])}, 1, ${i + 1}, ${esc(q[4])});`);
  });
}

// Quizzes for Front End Learning Path (c5) — 5 chapter quizzes + final, 5 MCQs each
const frontendQuizSeeds = [
  {
    title: "Chapter 1 Quiz — Foundations",
    description: "HTML, CSS, and editor basics from Chapter 1.",
    timeLimit: 15, passingScore: 50, maxAttempts: 3, order: 1,
    questions: [
      ["What does HTML primarily define on a webpage?", "MULTIPLE_CHOICE", '["The visual styling of elements","The structure and content of the page","Client-side animations only","Database schemas"]', "The structure and content of the page", "HTML marks up content structure; CSS handles presentation."],
      ["Which CSS property changes text color?", "MULTIPLE_CHOICE", '["font-weight","color","background-image","display"]', "color", "The color property sets the foreground text color."],
      ["Which tag is the correct HTML5 document type declaration?", "MULTIPLE_CHOICE", '["<!DOCTYPE html>","<doctype HTML5>","<html doctype>","<!HTML>"]', "<!DOCTYPE html>", "HTML5 uses the short <!DOCTYPE html> declaration."],
      ["VS Code is primarily used as a:", "MULTIPLE_CHOICE", '["Web browser","Code editor / IDE for writing code","Database server","CSS framework"]', "Code editor / IDE for writing code", "Visual Studio Code is a popular code editor for web development."],
      ['Which selector targets an element with id="hero"?', "MULTIPLE_CHOICE", '[".hero","#hero","hero","*hero"]', "#hero", "IDs are selected with a hash (#) in CSS."],
    ],
  },
  {
    title: "Chapter 2 Quiz — JavaScript & First Builds",
    description: "JavaScript fundamentals and building simple sites.",
    timeLimit: 15, passingScore: 50, maxAttempts: 3, order: 2,
    questions: [
      ["Which keyword declares a block-scoped variable that can be reassigned?", "MULTIPLE_CHOICE", '["var only","const","let","static"]', "let", "let is block-scoped and reassignable; const is not reassignable."],
      ["What does document.querySelector('.btn') return?", "MULTIPLE_CHOICE", '["All elements with class btn","The first element matching .btn, or null","A CSS stylesheet","A Node.js module"]', "The first element matching .btn, or null", "querySelector returns the first match; querySelectorAll returns all."],
      ["Which operator checks both value and type equality?", "MULTIPLE_CHOICE", '["==","===","=","!="]', "===", "=== is strict equality (no type coercion)."],
      ["In a typical front-end build, which language runs in the browser to add interactivity?", "MULTIPLE_CHOICE", '["SQL","JavaScript","Python","PHP only"]', "JavaScript", "Browsers execute JavaScript for interactive behavior."],
      ["Why is mobile-first / accessibility important when building web apps?", "MULTIPLE_CHOICE", '["It only improves SEO scores artificially","It helps more users use the product on phones and with assistive tech","It removes the need for CSS","It disables JavaScript"]', "It helps more users use the product on phones and with assistive tech", "Responsive and accessible design expands who can successfully use your site."],
    ],
  },
  {
    title: "Chapter 3 Quiz — Tools, Frameworks & React",
    description: "Git, Bootstrap/Tailwind, and React basics.",
    timeLimit: 15, passingScore: 50, maxAttempts: 3, order: 3,
    questions: [
      ["What does git commit do?", "MULTIPLE_CHOICE", '["Deletes the repository","Records a snapshot of staged changes in history","Deploys code to production","Installs npm packages"]', "Records a snapshot of staged changes in history", "A commit saves a checkpoint of your staged work."],
      ["React is mainly used to build:", "MULTIPLE_CHOICE", '["Operating systems","User interfaces with reusable components","Relational databases","Email servers"]', "User interfaces with reusable components", "React is a UI library organized around components."],
      ["Tailwind CSS is best described as a:", "MULTIPLE_CHOICE", '["JavaScript testing library","Utility-first CSS framework","NoSQL database","Git hosting service"]', "Utility-first CSS framework", "Tailwind provides utility classes for styling in markup."],
      ["Bootstrap helps you primarily with:", "MULTIPLE_CHOICE", '["Writing SQL queries","Prebuilt responsive UI components and grid layout","Compiling TypeScript","Managing server secrets"]', "Prebuilt responsive UI components and grid layout", "Bootstrap ships CSS/JS components for common UI patterns."],
      ["In React, props are used to:", "MULTIPLE_CHOICE", '["Mutate parent state directly from a child","Pass data from a parent component into a child","Replace HTML entirely","Store secrets on the client safely"]', "Pass data from a parent component into a child", "Props flow downward; treat them as read-only in the child."],
    ],
  },
  {
    title: "Chapter 4 Quiz — Testing, TypeScript & APIs",
    description: "Vite, testing, TypeScript, and GraphQL concepts.",
    timeLimit: 15, passingScore: 50, maxAttempts: 3, order: 4,
    questions: [
      ["Vite is commonly used as a:", "MULTIPLE_CHOICE", '["Front-end build tool / dev server","SQL database engine","CSS reset only","Mobile OS"]', "Front-end build tool / dev server", "Vite provides fast local development and production bundling."],
      ["Cypress is primarily a tool for:", "MULTIPLE_CHOICE", '["End-to-end testing of web apps in a browser","Designing Figma mockups","Hosting Docker containers","Writing Markdown docs"]', "End-to-end testing of web apps in a browser", "Cypress runs automated browser tests against your app."],
      ["TypeScript adds which benefit over plain JavaScript?", "MULTIPLE_CHOICE", '["Static types that catch many errors before runtime","Automatic database migrations","Built-in authentication","Free cloud hosting"]', "Static types that catch many errors before runtime", "TypeScript’s type system helps catch mistakes at compile time."],
      ["GraphQL APIs typically let clients:", "MULTIPLE_CHOICE", '["Only download ZIP files","Request exactly the fields they need in a query","Replace HTTPS","Disable CORS permanently"]', "Request exactly the fields they need in a query", "Clients specify the shape of data they want in a GraphQL query."],
      ["Why write tests for React components?", "MULTIPLE_CHOICE", '["To slow down development on purpose","To catch regressions and verify UI behavior","To remove the need for TypeScript","To replace version control"]', "To catch regressions and verify UI behavior", "Tests document expected behavior and prevent accidental breakage."],
    ],
  },
  {
    title: "Chapter 5 Quiz — Modern Frameworks & Security",
    description: "Next.js, React Native, Astro, and web security basics.",
    timeLimit: 15, passingScore: 50, maxAttempts: 3, order: 5,
    questions: [
      ["Next.js is a framework built on top of:", "MULTIPLE_CHOICE", '["Vue only","React","Angular exclusively","jQuery"]', "React", "Next.js extends React with routing, SSR/SSG, and more."],
      ["React Native is primarily used to build:", "MULTIPLE_CHOICE", '["Desktop spreadsheets","Native mobile apps for iOS and Android","PostgreSQL schemas","Email newsletters"]', "Native mobile apps for iOS and Android", "React Native targets mobile platforms with a React-like model."],
      ["Astro is known for shipping:", "MULTIPLE_CHOICE", '["Mostly zero JS by default for content sites","Only WebAssembly games","Only SQL stored procedures","Only native iOS apps"]', "Mostly zero JS by default for content sites", "Astro emphasizes shipping less client JavaScript for content pages."],
      ["OWASP API Security Top 10 helps developers:", "MULTIPLE_CHOICE", '["Learn fashion trends","Understand common API security risks and mitigations","Choose font families","Compress images only"]', "Understand common API security risks and mitigations", "OWASP documents frequent vulnerabilities and how to prevent them."],
      ["DNS primarily maps:", "MULTIPLE_CHOICE", '["Domain names to IP addresses","CSS classes to colors","React props to state","Git branches to commits only"]', "Domain names to IP addresses", "DNS resolves human-readable names to machine addresses."],
    ],
  },
  {
    title: "Final Exam — Front End Developer Path",
    description: "Pass this exam to complete the course and earn your certificate.",
    timeLimit: 25, passingScore: 50, maxAttempts: 2, order: 6,
    questions: [
      ["HTML, CSS, and JavaScript roughly map to:", "MULTIPLE_CHOICE", '["Structure, presentation, and behavior","Database, cache, and CDN only","Server, router, and firewall","Git, npm, and Docker"]', "Structure, presentation, and behavior", "Classic front-end triad: content structure, style, and interactivity."],
      ["Which tool tracks source code history?", "MULTIPLE_CHOICE", '["Git","Vite","Cypress","Tailwind"]', "Git", "Git is the version control system used throughout the path."],
      ["A React component should typically:", "MULTIPLE_CHOICE", '["Mutate props passed from its parent","Return UI (JSX) based on props and state","Run only on a database server","Replace the need for HTTPS"]', "Return UI (JSX) based on props and state", "Components describe UI from data (props/state)."],
      ["TypeScript helps catch errors:", "MULTIPLE_CHOICE", '["Only after production incidents","At compile / editor time via static types","By deleting unused CSS","By rewriting HTML automatically"]', "At compile / editor time via static types", "Types surface many mistakes before the code runs."],
      ["Keeping API keys in a public GitHub repo is:", "MULTIPLE_CHOICE", '["Recommended for open source","A serious security risk","Required by OWASP","Needed for DNS to work"]', "A serious security risk", "Secrets belong in environment variables, not source control."],
    ],
  },
];

for (const quiz of frontendQuizSeeds) {
  const quizId = cuid();
  sqls.push(`INSERT INTO "Quiz" (id, title, description, "courseId", "timeLimit", "passingScore", "maxAttempts", "order", "isActive", "createdAt") VALUES (${esc(quizId)}, ${esc(quiz.title)}, ${esc(quiz.description)}, ${esc(c5Id)}, ${quiz.timeLimit}, ${quiz.passingScore}, ${quiz.maxAttempts}, ${quiz.order}, true, '${now()}');`);
  quiz.questions.forEach((q, i) => {
    sqls.push(`INSERT INTO "Question" (id, "quizId", text, type, options, "correctAnswer", points, "order", explanation) VALUES (${esc(cuid())}, ${esc(quizId)}, ${esc(q[0])}, ${esc(q[1])}, ${esc(q[2])}, ${esc(q[3])}, 1, ${i + 1}, ${esc(q[4])});`);
  });
}

// Quizzes for HTML Tutorial for Beginners (c7) — chapter quiz + final, 5 MCQs each
const htmlQuizSeeds = [
  {
    title: "HTML Basics Quiz",
    description: "Check your understanding of beginner HTML concepts.",
    timeLimit: 12, passingScore: 50, maxAttempts: 3, order: 1,
    questions: [
      ["What does HTML stand for?", "MULTIPLE_CHOICE", '["HyperText Markup Language","High Transfer Machine Language","Hyperlink Text Managing Library","Home Tool Markup Logic"]', "HyperText Markup Language", "HTML is the standard markup language for web pages."],
      ["Which tag creates the largest default heading?", "MULTIPLE_CHOICE", '["<h6>","<h1>","<head>","<header>"]', "<h1>", "Heading levels go from h1 (largest) to h6 (smallest)."],
      ["Which tag is used to create a hyperlink?", "MULTIPLE_CHOICE", '["<link>","<a>","<href>","<url>"]', "<a>", "Anchor tags (<a href='...'>) create links."],
      ["Where should the main visible page content be placed?", "MULTIPLE_CHOICE", '["Inside the <head> element","Inside the <body> element","Inside a <style> tag only","Inside the DOCTYPE line"]', "Inside the <body> element", "Visible content belongs in <body>; metadata goes in <head>."],
      ["Which attribute provides alternative text for an image?", "MULTIPLE_CHOICE", '["src","href","alt","title only"]', "alt", "alt describes the image for accessibility and when images fail to load."],
    ],
  },
  {
    title: "Final Exam — HTML for Beginners",
    description: "Pass to complete the free HTML starter course.",
    timeLimit: 15, passingScore: 50, maxAttempts: 2, order: 2,
    questions: [
      ["A complete HTML document should start with:", "MULTIPLE_CHOICE", '["<!DOCTYPE html>","<start html>","<?html>","<document>"]', "<!DOCTYPE html>", "The DOCTYPE tells the browser to use HTML5 standards mode."],
      ["Which element groups paragraphs of text?", "MULTIPLE_CHOICE", '["<p>","<span> only","<img>","<br> only"]', "<p>", "<p> marks a paragraph block of text."],
      ["The <ul> element is used for:", "MULTIPLE_CHOICE", '["Unordered (bulleted) lists","Only numbered lists","Embedding videos","Defining CSS variables"]', "Unordered (bulleted) lists", "<ul> + <li> creates a bulleted list; <ol> is ordered."],
      ["Which tag embeds an image?", "MULTIPLE_CHOICE", '["<image>","<img>","<pic>","<media>"]', "<img>", "Use <img src='...' alt='...'> to show images."],
      ["Why structure pages with semantic tags like <header>, <main>, and <footer>?", "MULTIPLE_CHOICE", '["They replace CSS completely","They improve meaning, accessibility, and document structure","They are required for JavaScript to run","They encrypt form data"]', "They improve meaning, accessibility, and document structure", "Semantic HTML clarifies structure for browsers, assistive tech, and maintainers."],
    ],
  },
];

for (const quiz of htmlQuizSeeds) {
  const quizId = cuid();
  sqls.push(`INSERT INTO "Quiz" (id, title, description, "courseId", "timeLimit", "passingScore", "maxAttempts", "order", "isActive", "createdAt") VALUES (${esc(quizId)}, ${esc(quiz.title)}, ${esc(quiz.description)}, ${esc(c7Id)}, ${quiz.timeLimit}, ${quiz.passingScore}, ${quiz.maxAttempts}, ${quiz.order}, true, '${now()}');`);
  quiz.questions.forEach((q, i) => {
    sqls.push(`INSERT INTO "Question" (id, "quizId", text, type, options, "correctAnswer", points, "order", explanation) VALUES (${esc(cuid())}, ${esc(quizId)}, ${esc(q[0])}, ${esc(q[1])}, ${esc(q[2])}, ${esc(q[3])}, 1, ${i + 1}, ${esc(q[4])});`);
  });
}

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
sqls.push(`INSERT INTO "Notification" (id, "userId", title, message, type, link, "isRead", "createdAt") VALUES (${esc(cuid())}, ${esc(stu1Id)}, 'Free course unlocked!', 'Front End Developer Learning Path is in your My Courses — start watching anytime.', 'SUCCESS', '/dashboard/courses', false, '${now()}');`);

// Site Settings
sqls.push(`INSERT INTO "SiteSetting" (id, key, value) VALUES (${esc(cuid())}, 'siteName', 'EduFlow');`);
sqls.push(`INSERT INTO "SiteSetting" (id, key, value) VALUES (${esc(cuid())}, 'siteDescription', 'Online Learning Platform');`);
sqls.push(`INSERT INTO "SiteSetting" (id, key, value) VALUES (${esc(cuid())}, 'maintenanceMode', 'false');`);
sqls.push(`INSERT INTO "SiteSetting" (id, key, value) VALUES (${esc(cuid())}, 'allowRegistration', 'true');`);

// Announcement
sqls.push(`INSERT INTO "Announcement" (id, title, content, "userId", "createdAt") VALUES (${esc(cuid())}, 'Welcome to EduFlow!', 'We are excited to launch our new learning platform. Explore our courses and start learning today!', ${esc(adminId)}, '${now()}');`);

// Execute via pg (works on Windows; no psql / PGPASSWORD required)
const fullSql = sqls.join("\n");
const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error(`
Seed failed: No database URL found.

Create a .env file in the project root with DATABASE_URL and DIRECT_URL.
`);
  process.exit(1);
}

try {
  const pg = await import("pg");
  const { Client } = pg.default || pg;
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  await client.query(fullSql);
  await client.end();

  console.log("\n✅ Database seeded successfully!\n");
  console.log("Demo Accounts:");
  console.log("  Admin:      admin@eduflow.com / password123");
  console.log("  Instructor: instructor@eduflow.com / password123");
  console.log("  Student:    student@eduflow.com / password123");
  console.log("\n  All passwords: password123");
} catch (err) {
  console.error("Seed failed:", err.message || err);
  process.exit(1);
}
