import { useState } from 'react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { Upload, FileSpreadsheet, FileText, CheckCircle2, AlertCircle, Download } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface ImportedQuestion {
  content: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  difficulty_level: 'EASY' | 'MEDIUM' | 'HARD';
  subject_topic?: string;
  tags?: string;
}

interface QuestionImportProps {
  onImport: (questions: ImportedQuestion[]) => Promise<void>;
}

export default function QuestionImport({ onImport }: QuestionImportProps) {
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<ImportedQuestion[]>([]);
  const [message, setMessage] = useState('');

  const downloadTemplate = () => {
    const template = [
      {
        content: 'What is 2 + 2?',
        option_a: '3',
        option_b: '4',
        option_c: '5',
        option_d: '6',
        correct_answer: 'B',
        difficulty_level: 'EASY',
        subject_topic: 'Mathematics',
        tags: 'arithmetic,basic'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Questions');
    XLSX.writeFile(wb, 'question_template.xlsx');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        let parsed: any[] = [];

        if (file.name.endsWith('.csv')) {
          Papa.parse(data as string, {
            header: true,
            complete: (results) => {
              parsed = results.data;
              processData(parsed);
            }
          });
        } else {
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          parsed = XLSX.utils.sheet_to_json(sheet);
          processData(parsed);
        }
      } catch (error) {
        setMessage('Error parsing file: ' + (error as Error).message);
      }
    };

    if (file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }
  };

  const processData = (data: any[]) => {
    const questions: ImportedQuestion[] = data
      .filter(row => row.content && row.correct_answer)
      .map(row => ({
        content: row.content,
        option_a: row.option_a || '',
        option_b: row.option_b || '',
        option_c: row.option_c || '',
        option_d: row.option_d || '',
        correct_answer: row.correct_answer.toUpperCase(),
        difficulty_level: (row.difficulty_level?.toUpperCase() || 'MEDIUM') as any,
        subject_topic: row.subject_topic || '',
        tags: row.tags || ''
      }));

    setPreview(questions);
    setMessage(`Loaded ${questions.length} questions`);
  };

  const handleImport = async () => {
    setImporting(true);
    setMessage('');
    try {
      await onImport(preview);
      setMessage(`✅ Successfully imported ${preview.length} questions`);
      setPreview([]);
    } catch (error) {
      setMessage('❌ Import failed: ' + (error as Error).message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Import Questions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="h-4 w-4" />
            Download Template
          </Button>
          <label className="flex-1">
            <Button variant="premium" className="w-full" asChild>
              <span>
                <FileSpreadsheet className="h-4 w-4" />
                Upload Excel/CSV
              </span>
            </Button>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {message && (
          <div className={`rounded-md border p-3 text-sm ${
            message.includes('✅') ? 'bg-emerald-500/10 border-emerald-500/30' :
            message.includes('❌') ? 'bg-red-500/10 border-red-500/30' :
            'bg-blue-500/10 border-blue-500/30'
          }`}>
            {message}
          </div>
        )}

        {preview.length > 0 && (
          <>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {preview.slice(0, 5).map((q, i) => (
                <div key={i} className="rounded-md border border-border bg-muted/50 p-3 text-sm">
                  <p className="font-medium">{i + 1}. {q.content}</p>
                  <div className="mt-1 grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                    <span>A) {q.option_a}</span>
                    <span>B) {q.option_b}</span>
                    <span>C) {q.option_c}</span>
                    <span>D) {q.option_d}</span>
                  </div>
                  <div className="mt-1 flex gap-2 text-xs">
                    <span className="font-medium text-emerald-600">Answer: {q.correct_answer}</span>
                    <span>{q.difficulty_level}</span>
                  </div>
                </div>
              ))}
              {preview.length > 5 && (
                <p className="text-center text-sm text-muted-foreground">
                  ...and {preview.length - 5} more
                </p>
              )}
            </div>

            <Button 
              onClick={handleImport} 
              disabled={importing}
              className="w-full"
              variant="premium"
            >
              {importing ? 'Importing...' : `Import ${preview.length} Questions`}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
