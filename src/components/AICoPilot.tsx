/**
 * AI Co-Pilot Component for Question Generation
 * Allows faculty to upload syllabus and generate questions using AI
 */

import { useState, useCallback } from 'react';
import { 
  Upload, 
  FileText, 
  Sparkles, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Edit3,
  Save,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';
import type { 
  GeneratedQuestion, 
  QuestionType, 
  DifficultyLevel,
  FileUploadResponse,
  QuestionGenerationResponse,
  SaveQuestionsResponse
} from '../types/ai';

interface AICoPilotProps {
  token: string;
  facultyUserId: number;
  onQuestionsSaved: () => void;
}

export default function AICoPilot({ token, facultyUserId, onQuestionsSaved }: AICoPilotProps) {
  // State
  const [syllabusText, setSyllabusText] = useState('');
  const [questionType, setQuestionType] = useState<QuestionType>('MCQ');
  const [questionCount, setQuestionCount] = useState(5);
  const [difficultyLevel, setDifficultyLevel] = useState<DifficultyLevel>('MEDIUM');
  const [subjectTopic, setSubjectTopic] = useState('');
  
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');

  // Handle file upload
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      setMessage('Invalid file type. Only PDF and TXT files are allowed.');
      setMessageType('error');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setMessage('File too large. Maximum size is 10MB.');
      setMessageType('error');
      return;
    }

    setUploading(true);
    setMessage('Extracting text from file...');
    setMessageType('info');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/ai/upload-syllabus', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data: FileUploadResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Upload failed');
      }

      setSyllabusText(data.data.extractedText);
      setUploadedFile(data.data.filename);
      setMessage(`✓ Extracted ${data.data.wordCount} words from ${data.data.filename}`);
      setMessageType('success');
    } catch (error) {
      console.error('Upload error:', error);
      setMessage(error instanceof Error ? error.message : 'Upload failed');
      setMessageType('error');
    } finally {
      setUploading(false);
    }
  }, [token]);

  // Generate questions using AI
  const handleGenerateQuestions = useCallback(async () => {
    if (!syllabusText || syllabusText.trim().length < 50) {
      setMessage('Please provide at least 50 characters of syllabus text');
      setMessageType('error');
      return;
    }

    setGenerating(true);
    setMessage(`Generating ${questionCount} ${questionType} questions...`);
    setMessageType('info');

    try {
      const response = await fetch('/api/ai/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          syllabusText,
          questionType,
          count: questionCount,
          difficultyLevel,
          subjectTopic
        })
      });

      const data: QuestionGenerationResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Generation failed');
      }

      setGeneratedQuestions(data.questions);
      setMessage(`✓ ${data.message}`);
      setMessageType('success');
    } catch (error) {
      console.error('Generation error:', error);
      setMessage(error instanceof Error ? error.message : 'Generation failed');
      setMessageType('error');
    } finally {
      setGenerating(false);
    }
  }, [syllabusText, questionType, questionCount, difficultyLevel, subjectTopic, token]);

  // Save questions to database
  const handleSaveQuestions = useCallback(async () => {
    if (generatedQuestions.length === 0) {
      setMessage('No questions to save');
      setMessageType('error');
      return;
    }

    setSaving(true);
    setMessage('Saving questions to question bank...');
    setMessageType('info');

    try {
      const response = await fetch('/api/ai/save-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          questions: generatedQuestions
        })
      });

      const data: SaveQuestionsResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Save failed');
      }

      setMessage(`✓ ${data.message}`);
      setMessageType('success');
      
      // Clear generated questions after successful save
      setTimeout(() => {
        setGeneratedQuestions([]);
        onQuestionsSaved();
      }, 1500);
    } catch (error) {
      console.error('Save error:', error);
      setMessage(error instanceof Error ? error.message : 'Save failed');
      setMessageType('error');
    } finally {
      setSaving(false);
    }
  }, [generatedQuestions, token, onQuestionsSaved]);

  // Edit question
  const handleEditQuestion = (index: number) => {
    setEditingIndex(index);
  };

  // Update question
  const handleUpdateQuestion = (index: number, field: keyof GeneratedQuestion, value: string) => {
    const updated = [...generatedQuestions];
    (updated[index] as any)[field] = value;
    setGeneratedQuestions(updated);
  };

  // Delete question
  const handleDeleteQuestion = (index: number) => {
    setGeneratedQuestions(prev => prev.filter((_, i) => i !== index));
    setMessage(`Question ${index + 1} deleted`);
    setMessageType('info');
  };

  return (
    <div className="grid gap-6">
      {/* Configuration Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-500" />
            AI Co-Pilot - Question Generation
          </CardTitle>
          <CardDescription>
            Upload syllabus or paste content, then let AI generate questions for you
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          {/* File Upload */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Upload Syllabus (PDF or TXT)
            </label>
            <div className="flex items-center gap-3">
              <label className={cn(
                "flex-1 flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-6 cursor-pointer transition-colors",
                "hover:border-indigo-500 hover:bg-indigo-500/5"
              )}>
                <input
                  type="file"
                  accept=".pdf,.txt"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
                {uploading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
                    <span className="text-sm">Extracting text...</span>
                  </>
                ) : uploadedFile ? (
                  <>
                    <FileText className="h-5 w-5 text-emerald-500" />
                    <span className="text-sm font-medium">{uploadedFile}</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Click to upload or drag and drop
                    </span>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* OR Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 border-t border-border" />
            <span className="text-xs text-muted-foreground">OR</span>
            <div className="flex-1 border-t border-border" />
          </div>

          {/* Text Input */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Paste Syllabus Content
            </label>
            <textarea
              value={syllabusText}
              onChange={(e) => setSyllabusText(e.target.value)}
              placeholder="Paste your syllabus content here... (minimum 50 characters)"
              className="min-h-32 w-full rounded-md border border-input bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              disabled={uploading}
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-muted-foreground">
                {syllabusText.length} characters • {syllabusText.split(/\s+/).filter(Boolean).length} words
              </p>
            </div>
          </div>

          {/* Configuration Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Question Type */}
            <div>
              <label className="text-sm font-medium mb-2 block">Question Type</label>
              <select
                value={questionType}
                onChange={(e) => setQuestionType(e.target.value as QuestionType)}
                className="w-full rounded-md border border-input bg-background p-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="MCQ">Multiple Choice</option>
                <option value="Essay">Essay</option>
                <option value="FillInBlank">Fill in the Blank</option>
              </select>
            </div>

            {/* Count */}
            <div>
              <label className="text-sm font-medium mb-2 block">Question Count</label>
              <select
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full rounded-md border border-input bg-background p-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="5">5 Questions</option>
                <option value="10">10 Questions</option>
                <option value="15">15 Questions</option>
                <option value="20">20 Questions</option>
              </select>
            </div>

            {/* Difficulty */}
            <div>
              <label className="text-sm font-medium mb-2 block">Difficulty</label>
              <select
                value={difficultyLevel}
                onChange={(e) => setDifficultyLevel(e.target.value as DifficultyLevel)}
                className="w-full rounded-md border border-input bg-background p-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>

            {/* Subject/Topic */}
            <div>
              <label className="text-sm font-medium mb-2 block">Subject/Topic</label>
              <Input
                value={subjectTopic}
                onChange={(e) => setSubjectTopic(e.target.value)}
                placeholder="e.g., Data Structures"
              />
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerateQuestions}
            disabled={!syllabusText || syllabusText.trim().length < 50 || generating}
            variant="premium"
            size="lg"
            className="w-full"
          >
            {generating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Generating Questions...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Generate {questionCount} {questionType} Questions
              </>
            )}
          </Button>

          {/* Status Message */}
          {message && (
            <div className={cn(
              "rounded-md border p-3 text-sm",
              messageType === 'success' && "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200",
              messageType === 'error' && "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-200",
              messageType === 'info' && "border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-200"
            )}>
              {message}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generated Questions Preview */}
      {generatedQuestions.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  Generated Questions ({generatedQuestions.length})
                </CardTitle>
                <CardDescription>
                  Review, edit, or delete questions before saving to question bank
                </CardDescription>
              </div>
              <Button
                onClick={handleSaveQuestions}
                disabled={saving}
                variant="premium"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Approve & Save All
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {generatedQuestions.map((question, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-border bg-card/50 p-4"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500/10 text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                        {index + 1}
                      </span>
                      <Badge variant={
                        question.difficulty_level === 'EASY' ? 'success' :
                        question.difficulty_level === 'HARD' ? 'destructive' :
                        'default'
                      }>
                        {question.difficulty_level}
                      </Badge>
                      <Badge variant="outline">{question.question_type}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditQuestion(index)}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteQuestion(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {editingIndex === index ? (
                    <div className="grid gap-3">
                      <textarea
                        value={question.content}
                        onChange={(e) => handleUpdateQuestion(index, 'content', e.target.value)}
                        className="min-h-20 w-full rounded-md border border-input bg-background p-2 text-sm"
                      />
                      {question.question_type === 'MCQ' && (
                        <div className="grid gap-2">
                          {['option_a', 'option_b', 'option_c', 'option_d'].map((opt) => (
                            <Input
                              key={opt}
                              value={(question as any)[opt] || ''}
                              onChange={(e) => handleUpdateQuestion(index, opt as keyof GeneratedQuestion, e.target.value)}
                              placeholder={`Option ${opt.slice(-1).toUpperCase()}`}
                            />
                          ))}
                        </div>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingIndex(null)}
                      >
                        Done Editing
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <p className="font-medium mb-2">{question.content}</p>
                      
                      {question.question_type === 'MCQ' && (
                        <div className="grid gap-1 text-sm">
                          {['option_a', 'option_b', 'option_c', 'option_d'].map((opt, i) => (
                            <div
                              key={opt}
                              className={cn(
                                "rounded-md p-2",
                                question.correct_answer === String.fromCharCode(65 + i)
                                  ? "bg-emerald-500/10 border border-emerald-500/30 font-medium"
                                  : "bg-muted/50"
                              )}
                            >
                              {String.fromCharCode(65 + i)}. {(question as any)[opt]}
                              {question.correct_answer === String.fromCharCode(65 + i) && (
                                <span className="ml-2 text-emerald-600 dark:text-emerald-400">✓ Correct</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {question.question_type === 'Essay' && question.expected_answer && (
                        <div className="mt-2 rounded-md bg-muted/50 p-3 text-sm">
                          <p className="font-medium text-xs text-muted-foreground mb-1">Expected Answer:</p>
                          <p className="text-muted-foreground">{question.expected_answer}</p>
                        </div>
                      )}
                      
                      {question.question_type === 'FillInBlank' && question.correct_answer && (
                        <div className="mt-2 rounded-md bg-emerald-500/10 border border-emerald-500/30 p-2 text-sm">
                          <span className="font-medium">Answer:</span> {question.correct_answer}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
