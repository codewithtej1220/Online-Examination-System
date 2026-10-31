/**
 * Offline brain for "Ava", the in-app study assistant.
 * Keyword-scored intents for site guidance, exam rules and results, plus a
 * glossary of DBMS / CS concepts for doubt clarification.
 * Replies may include `actions` (buttons that navigate the UI to a view).
 */

const GLOSSARY = {
    "dbms": ["Database Management System", "Software that stores, retrieves and manages data in databases, handling concurrency, security, backup and integrity for you. Examples: MySQL, PostgreSQL, Oracle."],
    "rdbms": ["Relational DBMS", "A DBMS that stores data in tables (relations) of rows and columns and links them with keys. Queried using SQL."],
    "primary key": ["Primary key", "A column (or set of columns) whose value uniquely identifies each row. It can't be NULL and can't repeat."],
    "foreign key": ["Foreign key", "A column that refers to the primary key of another table, enforcing referential integrity — you can't reference a row that doesn't exist."],
    "candidate key": ["Candidate key", "Any minimal set of columns that could uniquely identify rows. One candidate key is chosen as the primary key."],
    "super key": ["Super key", "Any set of columns that uniquely identifies rows — candidate keys are the minimal super keys."],
    "normalization": ["Normalization", "Organizing tables to reduce redundancy and update anomalies by splitting data based on functional dependencies (1NF → 2NF → 3NF → BCNF)."],
    "1nf": ["First Normal Form (1NF)", "Every column holds atomic (indivisible) values and there are no repeating groups."],
    "2nf": ["Second Normal Form (2NF)", "In 1NF, and every non-key column depends on the whole primary key — no partial dependency on part of a composite key."],
    "3nf": ["Third Normal Form (3NF)", "In 2NF, and no non-key column depends on another non-key column — transitive dependencies are removed."],
    "bcnf": ["Boyce–Codd Normal Form", "A stricter 3NF: for every functional dependency X → Y, X must be a super key."],
    "functional dependency": ["Functional dependency", "X → Y means that knowing the value of X determines the value of Y (e.g. roll_no → student_name)."],
    "denormalization": ["Denormalization", "Deliberately adding redundancy (merging tables, storing computed values) to make reads faster at the cost of harder updates."],
    "acid": ["ACID properties", "Atomicity (all or nothing), Consistency (rules always hold), Isolation (concurrent transactions don't interfere), Durability (committed data survives crashes)."],
    "transaction": ["Transaction", "A group of operations treated as one unit of work: either all succeed (COMMIT) or none do (ROLLBACK)."],
    "deadlock": ["Deadlock", "Two or more transactions each wait for a lock the other holds, so none can proceed. DBMSs detect it and roll one back."],
    "index": ["Index", "A data structure (usually a B+ tree) that speeds up lookups on a column, like a book's index, at the cost of extra storage and slower writes."],
    "b+ tree": ["B+ tree", "A balanced tree where all data pointers live in linked leaf nodes — great for range queries and the standard structure for database indexes."],
    "join": ["Join", "Combines rows from two tables using a related column. INNER returns matches only; LEFT/RIGHT keep all rows from one side; FULL keeps both."],
    "inner join": ["Inner join", "Returns only rows that have matching values in both tables."],
    "left join": ["Left join", "Returns every row from the left table, plus matching rows from the right table (NULLs where there's no match)."],
    "sql": ["SQL", "Structured Query Language — DDL defines structure (CREATE, ALTER), DML changes data (INSERT, UPDATE, DELETE), DQL queries (SELECT), DCL controls access (GRANT)."],
    "ddl": ["DDL", "Data Definition Language: commands that define schema — CREATE, ALTER, DROP, TRUNCATE."],
    "dml": ["DML", "Data Manipulation Language: commands that change data — INSERT, UPDATE, DELETE."],
    "view": ["View", "A saved SELECT query that behaves like a virtual table. Useful for security and simplifying complex queries."],
    "trigger": ["Trigger", "SQL code that runs automatically before or after INSERT, UPDATE or DELETE on a table."],
    "stored procedure": ["Stored procedure", "A named, precompiled set of SQL statements stored in the database and called with parameters."],
    "er diagram": ["ER diagram", "Entity–Relationship diagram: models entities (rectangles), attributes (ovals) and relationships (diamonds) before building tables."],
    "entity": ["Entity", "A real-world object or concept you store data about, e.g. Student, Exam. Becomes a table."],
    "cardinality": ["Cardinality", "How many instances of one entity relate to another: one-to-one, one-to-many or many-to-many."],
    "concurrency control": ["Concurrency control", "Techniques (locking, timestamps, MVCC) that let transactions run at the same time without corrupting data."],
    "two phase locking": ["Two-phase locking (2PL)", "A transaction acquires all its locks in a growing phase and releases them in a shrinking phase; this guarantees serializability."],
    "serializability": ["Serializability", "A concurrent schedule is serializable if its result equals some serial (one-after-another) order of the same transactions."],
    "aggregate function": ["Aggregate functions", "Functions that summarise many rows into one value: COUNT, SUM, AVG, MIN, MAX — usually with GROUP BY."],
    "group by": ["GROUP BY", "Groups rows that share values so aggregates are computed per group. Filter groups with HAVING (WHERE filters rows before grouping)."],
    "having": ["HAVING", "Filters groups after GROUP BY, e.g. HAVING COUNT(*) > 5. WHERE can't use aggregates; HAVING can."],
    "subquery": ["Subquery", "A query nested inside another query, used in WHERE, FROM or SELECT. Correlated subqueries reference the outer query."],
    "relational algebra": ["Relational algebra", "The formal operations behind SQL: selection (σ), projection (π), join (⋈), union, difference and Cartesian product."],
    "data independence": ["Data independence", "Changing the schema at one level doesn't force changes at the level above — physical vs. logical independence."],
    "recursion": ["Recursion", "A function that solves a problem by calling itself on smaller inputs, with a base case to stop."],
    "time complexity": ["Time complexity", "How an algorithm's running time grows with input size, written in Big-O (e.g. O(n log n))."],
    "stack": ["Stack", "A LIFO (last-in, first-out) structure: push adds to the top, pop removes from the top."],
    "queue": ["Queue", "A FIFO (first-in, first-out) structure: enqueue at the back, dequeue from the front."]
};

const SITE_GUIDE = {
    student: {
        overview: "Here's how your portal works: verify your ID, open My Exams to start a test, then check Results and Progress after submitting.",
        actions: [
            { label: "Verify my ID", view: "verification" },
            { label: "Open my exams", view: "exams" },
            { label: "See my results", view: "results" },
            { label: "My progress", view: "progress" }
        ]
    },
    faculty: {
        overview: "As faculty you build question banks (manually, by import, or with the generator), create tests in Exam Studio, and watch attempts live in Monitoring.",
        actions: [
            { label: "Question bank", view: "questions" },
            { label: "Generate questions", view: "generator" },
            { label: "Exam Studio", view: "exams" },
            { label: "Live monitoring", view: "monitoring" }
        ]
    },
    admin: {
        overview: "The admin console shows system analytics, the user directory with all results, and a read-only SQL console.",
        actions: [
            { label: "Overview", view: "dashboard" },
            { label: "Users & results", view: "users" },
            { label: "SQL console", view: "database" }
        ]
    }
};

const INTENTS = [
    {
        id: "greeting",
        words: ["hi", "hello", "hey", "good morning", "good evening", "namaste"],
        reply: ({ name, role }) => ({ text: `Hi ${name}! I'm Ava, your study guide. ${SITE_GUIDE[role].overview} What would you like to do?`, actions: SITE_GUIDE[role].actions, mood: "wave" })
    },
    {
        id: "capabilities",
        words: ["what can you do", "help", "how does this work", "guide me", "where do i start", "get started", "how to use"],
        reply: ({ role }) => ({
            text: `I can help in three ways:\n• Evaluation — explain your test results and weak topics\n• Doubts — ask me "what is normalization?" or "difference between primary key and foreign key"\n• Directions — tell me what you want to do and I'll take you there.\n\n${SITE_GUIDE[role].overview}`,
            actions: SITE_GUIDE[role].actions
        })
    },
    {
        id: "start_exam",
        roles: ["student"],
        words: ["start exam", "take exam", "take test", "start test", "attempt", "my exams", "write exam", "begin"],
        reply: () => ({ text: "To take a test: verify your ID first, then open My Exams and press Start on an available exam. You'll set up your camera for proctoring, then the timer begins. Answers save automatically.", actions: [{ label: "Verify ID", view: "verification" }, { label: "Open my exams", view: "exams" }] })
    },
    {
        id: "results",
        words: ["result", "score", "marks", "grade", "how did i do", "performance", "evaluate", "evaluation"],
        reply: ({ role }) => role === "student"
            ? { text: "Your results are graded instantly when you submit. Open Results and press \"Review with Ava\" on any test — I'll break it down by topic and difficulty and suggest what to revise.", actions: [{ label: "Open results", view: "results" }] }
            : { text: role === "faculty" ? "Attempts on your exams appear in Live Monitoring with their status. Scores are calculated automatically on submission." : "All graded attempts are listed under Users & Results.", actions: [{ label: role === "faculty" ? "Monitoring" : "Users & results", view: role === "faculty" ? "monitoring" : "users" }] }
    },
    {
        id: "scoring",
        words: ["how is it scored", "marking", "negative marking", "how are marks", "scoring", "published", "provisional"],
        reply: () => ({ text: "Each correct MCQ earns 1 mark, with no negative marking. Your score is out of all questions in the exam, so unanswered questions count as 0. Results show as Provisional until your instructor publishes them." })
    },
    {
        id: "proctoring",
        words: ["proctor", "camera", "webcam", "tab switch", "full screen", "fullscreen", "cheating", "violation", "microphone", "recording", "rules"],
        reply: () => ({ text: "Exam rules: keep your face visible to the camera, stay in fullscreen, don't switch tabs or copy/paste, and keep the room quiet. Each of these is logged as a proctoring event your instructor can review. If the camera fails, allow camera access in the browser's address bar and reload." })
    },
    {
        id: "timer",
        words: ["timer", "time limit", "time left", "time runs out", "auto submit", "duration"],
        reply: () => ({ text: "The timer starts when your attempt begins and keeps running even if you reload. You'll get warnings as time runs low, and the exam submits automatically at zero — anything you've answered is saved." })
    },
    {
        id: "create_question",
        roles: ["faculty"],
        words: ["add question", "create question", "new question", "question bank", "import", "csv", "excel", "voice"],
        reply: () => ({ text: "In Question Bank you can type an MCQ with the rich editor (or dictate with the mic buttons), click a letter to mark the correct answer, or bulk-import a CSV/Excel file.", actions: [{ label: "Question bank", view: "questions" }] })
    },
    {
        id: "generate",
        roles: ["faculty"],
        words: ["generate", "generator", "auto", "automatic", "ai question", "from notes", "syllabus", "create test", "build test", "random test"],
        reply: () => ({ text: "The Test Generator has two tools:\n1. Notes → Questions: paste notes with one concept per line (\"Primary key: …\") and I'll write MCQs you can review and save.\n2. Auto Test Builder: pick topics, a difficulty mix and a question count, and it creates a ready-to-take exam from your bank.", actions: [{ label: "Open generator", view: "generator" }] })
    },
    {
        id: "create_exam",
        roles: ["faculty"],
        words: ["create exam", "schedule", "assign student", "attach question", "new exam"],
        reply: () => ({ text: "In Exam Studio: create the exam (title, duration, schedule), then attach questions and optionally assign specific students. Exams with no assigned students are open to everyone.", actions: [{ label: "Exam Studio", view: "exams" }] })
    },
    {
        id: "monitor",
        roles: ["faculty"],
        words: ["monitor", "live", "watch", "who is writing", "pause", "terminate"],
        reply: () => ({ text: "Open Live Monitoring and pick an exam — students currently taking it appear with real-time proctoring alerts, and you can message, pause or terminate a session.", actions: [{ label: "Live monitoring", view: "monitoring" }] })
    },
    {
        id: "admin_tools",
        roles: ["admin"],
        words: ["users", "sql", "query", "database", "analytics", "dashboard", "statistics"],
        reply: () => ({ text: "Overview shows live analytics; Users & Results lists every account and graded attempt; the SQL console runs read-only queries (SELECT/SHOW/DESCRIBE).", actions: SITE_GUIDE.admin.actions })
    },
    {
        id: "account",
        words: ["password", "forgot", "login", "logout", "sign in", "account", "register"],
        reply: () => ({ text: "Use the Logout button at the bottom of the sidebar (or the top bar on mobile). For a forgotten password, ask your administrator to reset it — password resets aren't self-service yet." })
    },
    {
        id: "points",
        roles: ["student"],
        words: ["points", "level", "badge", "achievement", "streak", "progress"],
        reply: () => ({ text: "You earn points for every correct answer and good score. Levels go up every 250 points, and badges unlock for milestones like your first exam or a perfect score.", actions: [{ label: "My progress", view: "progress" }] })
    },
    {
        id: "thanks",
        words: ["thank", "thanks", "great", "awesome", "cool"],
        reply: () => ({ text: "Happy to help! Ping me any time.", mood: "cheer" })
    }
];

function normalize(text) {
    return ` ${String(text).toLowerCase().replace(/[^a-z0-9+\s]/g, " ").replace(/\s+/g, " ").trim()} `;
}

function findConcepts(text) {
    const normalized = normalize(text);
    return Object.keys(GLOSSARY)
        .filter((key) => normalized.includes(` ${key} `) || normalized.includes(` ${key}s `))
        .sort((a, b) => b.length - a.length)
        // Drop shorter matches contained in a longer one ("join" inside "inner join")
        .filter((key, _index, all) => !all.some((other) => other !== key && other.includes(key) && normalized.includes(` ${other} `)));
}

function explainConcepts(keys) {
    if (keys.length >= 2) {
        const [a, b] = keys.map((key) => GLOSSARY[key]);
        return `Here's how they compare:\n\n${a[0]}: ${a[1]}\n\n${b[0]}: ${b[1]}`;
    }
    const [title, body] = GLOSSARY[keys[0]];
    return `${title}: ${body}`;
}

/**
 * @param {{message: string, role: string, name: string, view?: string, examInProgress?: boolean}} input
 * @returns {{text: string, actions?: {label: string, view: string}[], mood?: string}}
 */
function respond({ message, role, name, examInProgress }) {
    const text = normalize(message);
    const concepts = findConcepts(message);
    const asksConcept = concepts.length > 0 && /\b(what|define|explain|meaning|difference|vs|versus|compare|tell me about|describe)\b/.test(text);

    if (examInProgress && (asksConcept || concepts.length)) {
        return { text: "You have an exam in progress, so I can't explain course concepts right now — that keeps things fair for everyone. I can still help with exam rules, the timer or technical issues. Good luck!", mood: "think" };
    }

    if (asksConcept) {
        return { text: explainConcepts(concepts), mood: "explain" };
    }

    let best = null;
    let bestScore = 0;
    for (const intent of INTENTS) {
        if (intent.roles && !intent.roles.includes(role)) continue;
        const score = intent.words.reduce((sum, word) => (text.includes(` ${word} `) || text.includes(` ${word}`) ? sum + word.split(" ").length : sum), 0);
        if (score > bestScore) {
            best = intent;
            bestScore = score;
        }
    }

    if (best) return best.reply({ role, name });

    // A bare concept name ("normalization?") is still a doubt
    if (concepts.length) return { text: explainConcepts(concepts), mood: "explain" };

    return {
        text: `I'm not sure about that one yet. Try asking about a concept ("what is a foreign key?"), your results, exam rules, or where to find something.\n\n${SITE_GUIDE[role].overview}`,
        actions: SITE_GUIDE[role].actions,
        mood: "think"
    };
}

module.exports = { respond, GLOSSARY, SITE_GUIDE };
