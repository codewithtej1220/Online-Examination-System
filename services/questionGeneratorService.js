/**
 * Offline MCQ generation from study notes.
 *
 * Notes are parsed into (term, definition) pairs, from lines like
 *   "Normalization: organizing data to reduce redundancy"
 *   "Primary key - a column that uniquely identifies each row"
 *   "A deadlock is a state where transactions wait on each other forever."
 * Each pair becomes a question, and the other pairs supply the distractors,
 * so every wrong option is a real concept from the same notes.
 */

const LETTERS = ["A", "B", "C", "D"];

function shuffle(items) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

function clean(text) {
    return text.replace(/\s+/g, " ").replace(/^[\s*•\-\d.)]+/, "").trim();
}

function trimDefinition(text, max = 160) {
    const sentence = text.replace(/\.$/, "");
    return sentence.length > max ? `${sentence.slice(0, max - 1).trimEnd()}…` : sentence;
}

function extractPairs(notes) {
    const pairs = [];
    const seen = new Set();
    const add = (term, definition) => {
        term = clean(term).replace(/[:\-–—=]+$/, "").trim();
        definition = clean(definition);
        const key = term.toLowerCase();
        if (term.length < 2 || term.length > 70 || definition.length < 8 || seen.has(key)) return;
        if (term.split(" ").length > 8) return;
        seen.add(key);
        pairs.push({ term: term.charAt(0).toUpperCase() + term.slice(1), definition: definition.charAt(0).toUpperCase() + definition.slice(1) });
    };

    const lines = notes.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    for (const line of lines) {
        const separated = line.match(/^(.{2,70}?)\s*(?::|\s[-–—=]\s)\s*(.{8,})$/);
        if (separated) {
            add(separated[1], separated[2]);
            continue;
        }
        // Fall back to "X is/are/refers to/means Y" sentences
        for (const sentence of line.split(/(?<=[.!?])\s+/)) {
            const definitional = sentence.match(/^(?:an?\s+|the\s+)?([A-Za-z][\w\s()/'-]{1,60}?)\s+(?:is|are|refers to|means|is defined as)\s+(.{8,})$/i);
            if (definitional) add(definitional[1], definitional[2]);
        }
    }
    return pairs;
}

function buildQuestion(pair, others, style, meta) {
    const distractors = shuffle(others).slice(0, 3);
    const optionsPool = style === "term"
        ? [pair.term, ...distractors.map((item) => item.term)]
        : [trimDefinition(pair.definition), ...distractors.map((item) => trimDefinition(item.definition))];
    const correctText = optionsPool[0];
    const options = shuffle(optionsPool);

    return {
        content: style === "term"
            ? `Which term is best described by: "${trimDefinition(pair.definition, 220)}"?`
            : `Which of the following best describes ${pair.term}?`,
        option_a: options[0],
        option_b: options[1],
        option_c: options[2],
        option_d: options[3],
        correct_answer: LETTERS[options.indexOf(correctText)],
        difficulty_level: meta.difficulty,
        subject_topic: meta.subjectTopic || null,
        tags: "generated"
    };
}

/**
 * @returns {{ questions: object[], pairsFound: number }}
 */
function generateFromNotes(notes, { count = 10, difficulty = "MEDIUM", subjectTopic = "" } = {}) {
    const pairs = extractPairs(notes || "");
    if (pairs.length < 4) {
        return { questions: [], pairsFound: pairs.length };
    }

    // Hard questions ask for the definition (longer, closer distractors); easy ones ask for the term
    const styles = difficulty === "EASY" ? ["term"] : difficulty === "HARD" ? ["definition"] : ["term", "definition"];
    const questions = [];
    const order = shuffle(pairs);
    for (let round = 0; questions.length < count && round < styles.length; round++) {
        for (const [position, pair] of order.entries()) {
            if (questions.length >= count) break;
            // Each pass gives every pair the opposite question style from the previous pass
            const style = styles[(position + round) % styles.length];
            const others = pairs.filter((item) => item !== pair);
            questions.push(buildQuestion(pair, others, style, { difficulty, subjectTopic }));
        }
    }

    return { questions: questions.slice(0, count), pairsFound: pairs.length };
}

/**
 * Pick questions for an auto-generated test.
 * mix: { EASY: 30, MEDIUM: 50, HARD: 20 } (percentages)
 */
function pickQuestions(candidates, total, mix) {
    const byDifficulty = { EASY: [], MEDIUM: [], HARD: [] };
    for (const question of shuffle(candidates)) {
        (byDifficulty[question.difficulty_level] || byDifficulty.MEDIUM).push(question);
    }

    const levels = ["EASY", "MEDIUM", "HARD"];
    const weightSum = levels.reduce((sum, level) => sum + (Number(mix?.[level]) || 0), 0) || 1;
    const picked = [];
    for (const level of levels) {
        const wanted = Math.round((total * (Number(mix?.[level]) || 0)) / weightSum);
        picked.push(...byDifficulty[level].splice(0, wanted));
    }

    // Top up (or trim) so the test has exactly `total` questions when the bank allows it
    const leftovers = shuffle([...byDifficulty.EASY, ...byDifficulty.MEDIUM, ...byDifficulty.HARD]);
    while (picked.length < total && leftovers.length) picked.push(leftovers.shift());
    return picked.slice(0, total);
}

module.exports = { generateFromNotes, extractPairs, pickQuestions };
