/**
 * Upsert concept quizzes for:
 * - Front End Developer Learning Path
 * - HTML Tutorial for Beginners
 *
 * Safe to re-run: replaces existing quizzes on those courses only.
 */
import "dotenv/config";
import { randomBytes } from "crypto";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function cuid() {
  return "c" + randomBytes(12).toString("hex").slice(0, 24);
}

const connectionString = process.env.DATABASE_URL ?? process.env.DIRECT_URL;
if (!connectionString) {
  console.error("Missing DATABASE_URL / DIRECT_URL");
  process.exit(1);
}

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

/** @typedef {{ text: string, options: string[], correctAnswer: string, explanation?: string }} Q */

/** @type {Record<string, { title: string, description: string, order: number, timeLimit: number, maxAttempts: number, questions: Q[] }[]>} */
const QUIZZES_BY_SLUG = {
  "front-end-developer-learning-path": [
    {
      title: "Chapter 1 Quiz — Foundations",
      description: "HTML, CSS, and editor basics from Chapter 1.",
      order: 1,
      timeLimit: 15,
      maxAttempts: 3,
      questions: [
        {
          text: "What does HTML primarily define on a webpage?",
          options: [
            "The visual styling of elements",
            "The structure and content of the page",
            "Client-side animations only",
            "Database schemas",
          ],
          correctAnswer: "The structure and content of the page",
          explanation: "HTML marks up content structure; CSS handles presentation.",
        },
        {
          text: "Which CSS property changes text color?",
          options: ["font-weight", "color", "background-image", "display"],
          correctAnswer: "color",
          explanation: "The color property sets the foreground text color.",
        },
        {
          text: "Which tag is the correct HTML5 document type declaration?",
          options: [
            "<!DOCTYPE html>",
            "<doctype HTML5>",
            "<html doctype>",
            "<!HTML>",
          ],
          correctAnswer: "<!DOCTYPE html>",
          explanation: "HTML5 uses the short <!DOCTYPE html> declaration.",
        },
        {
          text: "VS Code is primarily used as a:",
          options: [
            "Web browser",
            "Code editor / IDE for writing code",
            "Database server",
            "CSS framework",
          ],
          correctAnswer: "Code editor / IDE for writing code",
          explanation: "Visual Studio Code is a popular code editor for web development.",
        },
        {
          text: "Which selector targets an element with id=\"hero\"?",
          options: [".hero", "#hero", "hero", "*hero"],
          correctAnswer: "#hero",
          explanation: "IDs are selected with a hash (#) in CSS.",
        },
      ],
    },
    {
      title: "Chapter 2 Quiz — JavaScript & First Builds",
      description: "JavaScript fundamentals and building simple sites.",
      order: 2,
      timeLimit: 15,
      maxAttempts: 3,
      questions: [
        {
          text: "Which keyword declares a block-scoped variable that can be reassigned?",
          options: ["var only", "const", "let", "static"],
          correctAnswer: "let",
          explanation: "let is block-scoped and reassignable; const is not reassignable.",
        },
        {
          text: "What does document.querySelector('.btn') return?",
          options: [
            "All elements with class btn",
            "The first element matching .btn, or null",
            "A CSS stylesheet",
            "A Node.js module",
          ],
          correctAnswer: "The first element matching .btn, or null",
          explanation: "querySelector returns the first match; querySelectorAll returns all.",
        },
        {
          text: "Which operator checks both value and type equality?",
          options: ["==", "===", "=", "!="],
          correctAnswer: "===",
          explanation: "=== is strict equality (no type coercion).",
        },
        {
          text: "In a typical front-end build, which language runs in the browser to add interactivity?",
          options: ["SQL", "JavaScript", "Python", "PHP only"],
          correctAnswer: "JavaScript",
          explanation: "Browsers execute JavaScript for interactive behavior.",
        },
        {
          text: "Why is mobile-first / accessibility important when building web apps?",
          options: [
            "It only improves SEO scores artificially",
            "It helps more users use the product on phones and with assistive tech",
            "It removes the need for CSS",
            "It disables JavaScript",
          ],
          correctAnswer:
            "It helps more users use the product on phones and with assistive tech",
          explanation:
            "Responsive and accessible design expands who can successfully use your site.",
        },
      ],
    },
    {
      title: "Chapter 3 Quiz — Tools, Frameworks & React",
      description: "Git, Bootstrap/Tailwind, and React basics.",
      order: 3,
      timeLimit: 15,
      maxAttempts: 3,
      questions: [
        {
          text: "What does git commit do?",
          options: [
            "Deletes the repository",
            "Records a snapshot of staged changes in history",
            "Deploys code to production",
            "Installs npm packages",
          ],
          correctAnswer: "Records a snapshot of staged changes in history",
          explanation: "A commit saves a checkpoint of your staged work.",
        },
        {
          text: "React is mainly used to build:",
          options: [
            "Operating systems",
            "User interfaces with reusable components",
            "Relational databases",
            "Email servers",
          ],
          correctAnswer: "User interfaces with reusable components",
          explanation: "React is a UI library organized around components.",
        },
        {
          text: "Tailwind CSS is best described as a:",
          options: [
            "JavaScript testing library",
            "Utility-first CSS framework",
            "NoSQL database",
            "Git hosting service",
          ],
          correctAnswer: "Utility-first CSS framework",
          explanation: "Tailwind provides utility classes for styling in markup.",
        },
        {
          text: "Bootstrap helps you primarily with:",
          options: [
            "Writing SQL queries",
            "Prebuilt responsive UI components and grid layout",
            "Compiling TypeScript",
            "Managing server secrets",
          ],
          correctAnswer: "Prebuilt responsive UI components and grid layout",
          explanation: "Bootstrap ships CSS/JS components for common UI patterns.",
        },
        {
          text: "In React, props are used to:",
          options: [
            "Mutate parent state directly from a child",
            "Pass data from a parent component into a child",
            "Replace HTML entirely",
            "Store secrets on the client safely",
          ],
          correctAnswer: "Pass data from a parent component into a child",
          explanation: "Props flow downward; treat them as read-only in the child.",
        },
      ],
    },
    {
      title: "Chapter 4 Quiz — Testing, TypeScript & APIs",
      description: "Vite, testing, TypeScript, and GraphQL concepts.",
      order: 4,
      timeLimit: 15,
      maxAttempts: 3,
      questions: [
        {
          text: "Vite is commonly used as a:",
          options: [
            "Front-end build tool / dev server",
            "SQL database engine",
            "CSS reset only",
            "Mobile OS",
          ],
          correctAnswer: "Front-end build tool / dev server",
          explanation: "Vite provides fast local development and production bundling.",
        },
        {
          text: "Cypress is primarily a tool for:",
          options: [
            "End-to-end testing of web apps in a browser",
            "Designing Figma mockups",
            "Hosting Docker containers",
            "Writing Markdown docs",
          ],
          correctAnswer: "End-to-end testing of web apps in a browser",
          explanation: "Cypress runs automated browser tests against your app.",
        },
        {
          text: "TypeScript adds which benefit over plain JavaScript?",
          options: [
            "Static types that catch many errors before runtime",
            "Automatic database migrations",
            "Built-in authentication",
            "Free cloud hosting",
          ],
          correctAnswer: "Static types that catch many errors before runtime",
          explanation: "TypeScript’s type system helps catch mistakes at compile time.",
        },
        {
          text: "GraphQL APIs typically let clients:",
          options: [
            "Only download ZIP files",
            "Request exactly the fields they need in a query",
            "Replace HTTPS",
            "Disable CORS permanently",
          ],
          correctAnswer: "Request exactly the fields they need in a query",
          explanation: "Clients specify the shape of data they want in a GraphQL query.",
        },
        {
          text: "Why write tests for React components?",
          options: [
            "To slow down development on purpose",
            "To catch regressions and verify UI behavior",
            "To remove the need for TypeScript",
            "To replace version control",
          ],
          correctAnswer: "To catch regressions and verify UI behavior",
          explanation: "Tests document expected behavior and prevent accidental breakage.",
        },
      ],
    },
    {
      title: "Chapter 5 Quiz — Modern Frameworks & Security",
      description: "Next.js, React Native, Astro, and web security basics.",
      order: 5,
      timeLimit: 15,
      maxAttempts: 3,
      questions: [
        {
          text: "Next.js is a framework built on top of:",
          options: ["Vue only", "React", "Angular exclusively", "jQuery"],
          correctAnswer: "React",
          explanation: "Next.js extends React with routing, SSR/SSG, and more.",
        },
        {
          text: "React Native is primarily used to build:",
          options: [
            "Desktop spreadsheets",
            "Native mobile apps for iOS and Android",
            "PostgreSQL schemas",
            "Email newsletters",
          ],
          correctAnswer: "Native mobile apps for iOS and Android",
          explanation: "React Native targets mobile platforms with a React-like model.",
        },
        {
          text: "Astro is known for shipping:",
          options: [
            "Mostly zero JS by default for content sites",
            "Only WebAssembly games",
            "Only SQL stored procedures",
            "Only native iOS apps",
          ],
          correctAnswer: "Mostly zero JS by default for content sites",
          explanation: "Astro emphasizes shipping less client JavaScript for content pages.",
        },
        {
          text: "OWASP API Security Top 10 helps developers:",
          options: [
            "Learn fashion trends",
            "Understand common API security risks and mitigations",
            "Choose font families",
            "Compress images only",
          ],
          correctAnswer: "Understand common API security risks and mitigations",
          explanation: "OWASP documents frequent vulnerabilities and how to prevent them.",
        },
        {
          text: "DNS primarily maps:",
          options: [
            "Domain names to IP addresses",
            "CSS classes to colors",
            "React props to state",
            "Git branches to commits only",
          ],
          correctAnswer: "Domain names to IP addresses",
          explanation: "DNS resolves human-readable names to machine addresses.",
        },
      ],
    },
    {
      title: "Final Exam — Front End Developer Path",
      description: "Pass this exam to complete the course and earn your certificate.",
      order: 6,
      timeLimit: 25,
      maxAttempts: 2,
      questions: [
        {
          text: "HTML, CSS, and JavaScript roughly map to:",
          options: [
            "Structure, presentation, and behavior",
            "Database, cache, and CDN only",
            "Server, router, and firewall",
            "Git, npm, and Docker",
          ],
          correctAnswer: "Structure, presentation, and behavior",
          explanation: "Classic front-end triad: content structure, style, and interactivity.",
        },
        {
          text: "Which tool tracks source code history?",
          options: ["Git", "Vite", "Cypress", "Tailwind"],
          correctAnswer: "Git",
          explanation: "Git is the version control system used throughout the path.",
        },
        {
          text: "A React component should typically:",
          options: [
            "Mutate props passed from its parent",
            "Return UI (JSX) based on props and state",
            "Run only on a database server",
            "Replace the need for HTTPS",
          ],
          correctAnswer: "Return UI (JSX) based on props and state",
          explanation: "Components describe UI from data (props/state).",
        },
        {
          text: "TypeScript helps catch errors:",
          options: [
            "Only after production incidents",
            "At compile / editor time via static types",
            "By deleting unused CSS",
            "By rewriting HTML automatically",
          ],
          correctAnswer: "At compile / editor time via static types",
          explanation: "Types surface many mistakes before the code runs.",
        },
        {
          text: "Keeping API keys in a public GitHub repo is:",
          options: [
            "Recommended for open source",
            "A serious security risk",
            "Required by OWASP",
            "Needed for DNS to work",
          ],
          correctAnswer: "A serious security risk",
          explanation: "Secrets belong in environment variables, not source control.",
        },
      ],
    },
  ],

  "html-tutorial-for-beginners": [
    {
      title: "HTML Basics Quiz",
      description: "Check your understanding of beginner HTML concepts.",
      order: 1,
      timeLimit: 12,
      maxAttempts: 3,
      questions: [
        {
          text: "What does HTML stand for?",
          options: [
            "Hyper Text Markup Language",
            "High Transfer Machine Language",
            "Hyperlink Text Managing Library",
            "Home Tool Markup Logic",
          ],
          correctAnswer: "HyperText Markup Language",
          explanation: "HTML is the standard markup language for web pages.",
        },
        {
          text: "Which tag creates the largest default heading?",
          options: ["<h6>", "<h1>", "<head>", "<header>"],
          correctAnswer: "<h1>",
          explanation: "Heading levels go from h1 (largest) to h6 (smallest).",
        },
        {
          text: "Which tag is used to create a hyperlink?",
          options: ["<link>", "<a>", "<href>", "<url>"],
          correctAnswer: "<a>",
          explanation: "Anchor tags (<a href=\"...\">) create links.",
        },
        {
          text: "Where should the main visible page content be placed?",
          options: [
            "Inside the <head> element",
            "Inside the <body> element",
            "Inside a <style> tag only",
            "Inside the DOCTYPE line",
          ],
          correctAnswer: "Inside the <body> element",
          explanation: "Visible content belongs in <body>; metadata goes in <head>.",
        },
        {
          text: "Which attribute provides alternative text for an image?",
          options: ["src", "href", "alt", "title only"],
          correctAnswer: "alt",
          explanation: "alt describes the image for accessibility and when images fail to load.",
        },
      ],
    },
    {
      title: "Final Exam — HTML for Beginners",
      description: "Pass to complete the free HTML starter course.",
      order: 2,
      timeLimit: 15,
      maxAttempts: 2,
      questions: [
        {
          text: "A complete HTML document should start with:",
          options: [
            "<!DOCTYPE html>",
            "<start html>",
            "<?html>",
            "<document>",
          ],
          correctAnswer: "<!DOCTYPE html>",
          explanation: "The DOCTYPE tells the browser to use HTML5 standards mode.",
        },
        {
          text: "Which element groups paragraphs of text?",
          options: ["<p>", "<span> only", "<img>", "<br> only"],
          correctAnswer: "<p>",
          explanation: "<p> marks a paragraph block of text.",
        },
        {
          text: "The <ul> element is used for:",
          options: [
            "Unordered (bulleted) lists",
            "Only numbered lists",
            "Embedding videos",
            "Defining CSS variables",
          ],
          correctAnswer: "Unordered (bulleted) lists",
          explanation: "<ul> + <li> creates a bulleted list; <ol> is ordered.",
        },
        {
          text: "Which tag embeds an image?",
          options: ["<image>", "<img>", "<pic>", "<media>"],
          correctAnswer: "<img>",
          explanation: "Use <img src=\"...\" alt=\"...\"> to show images.",
        },
        {
          text: "Why structure pages with semantic tags like <header>, <main>, and <footer>?",
          options: [
            "They replace CSS completely",
            "They improve meaning, accessibility, and document structure",
            "They are required for JavaScript to run",
            "They encrypt form data",
          ],
          correctAnswer:
            "They improve meaning, accessibility, and document structure",
          explanation:
            "Semantic HTML clarifies structure for browsers, assistive tech, and maintainers.",
        },
      ],
    },
  ],
};

async function seedCourseQuizzes(slug) {
  const defs = QUIZZES_BY_SLUG[slug];
  if (!defs) throw new Error(`No quiz definitions for ${slug}`);

  const course = await db.course.findFirst({
    where: { slug },
    select: {
      id: true,
      title: true,
      sections: { select: { order: true, title: true }, orderBy: { order: "asc" } },
      _count: { select: { quizzes: true } },
    },
  });

  if (!course) {
    console.warn(`⚠ Course not found: ${slug} — skipping`);
    return;
  }

  console.log(
    `\n→ ${course.title} (${slug}) — ${course.sections.length} sections, ${course._count.quizzes} existing quizzes`
  );

  // Remove existing quizzes (cascade questions/attempts) so re-run is clean
  const deleted = await db.quiz.deleteMany({ where: { courseId: course.id } });
  if (deleted.count) {
    console.log(`  removed ${deleted.count} old quiz(es)`);
  }

  for (const quiz of defs) {
    const created = await db.quiz.create({
      data: {
        id: cuid(),
        title: quiz.title,
        description: quiz.description,
        courseId: course.id,
        timeLimit: quiz.timeLimit,
        passingScore: 50,
        maxAttempts: quiz.maxAttempts,
        order: quiz.order,
        isActive: true,
        questions: {
          create: quiz.questions.map((q, i) => ({
            id: cuid(),
            text: q.text,
            type: "MULTIPLE_CHOICE",
            options: JSON.stringify(q.options),
            correctAnswer: q.correctAnswer,
            points: 1,
            order: i + 1,
            explanation: q.explanation ?? null,
          })),
        },
      },
      include: { _count: { select: { questions: true } } },
    });
    console.log(
      `  + ${created.title} (order ${created.order}, ${created._count.questions} MCQs)`
    );
  }
}

const slugs = Object.keys(QUIZZES_BY_SLUG);

console.log("Seeding instructor-style quizzes for:", slugs.join(", "));

for (const slug of slugs) {
  await seedCourseQuizzes(slug);
}

console.log("\nDone.");
await db.$disconnect();
