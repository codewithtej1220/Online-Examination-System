/**
 * Calculator Widget
 * Features: Basic & scientific operations, draggable, memory functions
 */

import { useState } from 'react';
import Draggable from 'react-draggable';
import { evaluate, sqrt, sin, cos, tan, pi } from 'mathjs';
import { X, Minimize2, Maximize2, Delete, RotateCcw } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

interface CalculatorProps {
  onClose: () => void;
  className?: string;
}

export default function Calculator({ onClose, className }: CalculatorProps) {
  const [display, setDisplay] = useState('0');
  const [history, setHistory] = useState<string[]>([]);
  const [memory, setMemory] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isScientific, setIsScientific] = useState(false);

  // Handle number/operator input
  const handleInput = (value: string) => {
    if (display === '0' && value !== '.') {
      setDisplay(value);
    } else {
      setDisplay(display + value);
    }
  };

  // Calculate result
  const calculate = () => {
    try {
      // Replace × and ÷ with * and /
      const expression = display.replace(/×/g, '*').replace(/÷/g, '/');
      const result = evaluate(expression);
      const resultStr = Number(result).toString();
      
      setHistory([...history, `${display} = ${resultStr}`].slice(-10));
      setDisplay(resultStr);
    } catch (error) {
      setDisplay('Error');
      setTimeout(() => setDisplay('0'), 1500);
    }
  };

  // Clear display
  const clear = () => {
    setDisplay('0');
  };

  // Backspace
  const backspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  // Scientific functions
  const handleScientific = (func: string) => {
    try {
      const value = parseFloat(display);
      let result: number;

      switch (func) {
        case 'sin':
          result = sin(value * (pi / 180)); // Convert to radians
          break;
        case 'cos':
          result = cos(value * (pi / 180));
          break;
        case 'tan':
          result = tan(value * (pi / 180));
          break;
        case 'sqrt':
          // sqrt of a negative number is complex; show it as an invalid result
          result = value < 0 ? NaN : (sqrt(value) as number);
          break;
        case 'square':
          result = value * value;
          break;
        case 'power':
          setDisplay(display + '^');
          return;
        default:
          return;
      }

      setDisplay(result.toString());
    } catch (error) {
      setDisplay('Error');
      setTimeout(() => setDisplay('0'), 1500);
    }
  };

  // Memory functions
  const memoryAdd = () => {
    setMemory(memory + parseFloat(display));
  };

  const memorySubtract = () => {
    setMemory(memory - parseFloat(display));
  };

  const memoryRecall = () => {
    setDisplay(memory.toString());
  };

  const memoryClear = () => {
    setMemory(0);
  };

  if (isMinimized) {
    return (
      <Draggable handle=".drag-handle">
        <div className={cn('fixed bottom-4 right-4 z-40', className)}>
          <div className="drag-handle flex cursor-move items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 shadow-lg">
            <span className="text-sm font-medium">Calculator</span>
            <button
              onClick={() => setIsMinimized(false)}
              className="rounded p-1 hover:bg-muted"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="rounded p-1 hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Draggable>
    );
  }

  return (
    <Draggable handle=".drag-handle" bounds="parent">
      <div className={cn('fixed bottom-4 right-4 z-40', className)}>
        <div className="w-80 rounded-lg border border-border bg-card shadow-2xl">
          {/* Header */}
          <div className="drag-handle flex cursor-move items-center justify-between border-b border-border bg-muted/50 px-4 py-2">
            <span className="text-sm font-semibold">Calculator</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsScientific(!isScientific)}
                className="rounded px-2 py-1 text-xs hover:bg-muted"
              >
                {isScientific ? 'Basic' : 'Scientific'}
              </button>
              <button
                onClick={() => setIsMinimized(true)}
                className="rounded p-1 hover:bg-muted"
              >
                <Minimize2 className="h-4 w-4" />
              </button>
              <button
                onClick={onClose}
                className="rounded p-1 hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Display */}
          <div className="border-b border-border bg-background/50 p-4">
            <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>Memory: {memory !== 0 ? memory : '—'}</span>
              <span>{history.length > 0 ? history[history.length - 1] : ''}</span>
            </div>
            <input
              type="text"
              value={display}
              readOnly
              className="w-full bg-transparent text-right text-3xl font-semibold outline-none"
            />
          </div>

          {/* Scientific buttons (if enabled) */}
          {isScientific && (
            <div className="grid grid-cols-4 gap-1 border-b border-border p-2">
              <Button variant="outline" size="sm" onClick={() => handleScientific('sin')}>sin</Button>
              <Button variant="outline" size="sm" onClick={() => handleScientific('cos')}>cos</Button>
              <Button variant="outline" size="sm" onClick={() => handleScientific('tan')}>tan</Button>
              <Button variant="outline" size="sm" onClick={() => handleScientific('sqrt')}>√</Button>
              <Button variant="outline" size="sm" onClick={() => handleScientific('square')}>x²</Button>
              <Button variant="outline" size="sm" onClick={() => handleScientific('power')}>x^y</Button>
              <Button variant="outline" size="sm" onClick={() => handleInput('3.14159')}>π</Button>
              <Button variant="outline" size="sm" onClick={() => handleInput('2.71828')}>e</Button>
            </div>
          )}

          {/* Memory buttons */}
          <div className="grid grid-cols-4 gap-1 border-b border-border p-2">
            <Button variant="outline" size="sm" onClick={memoryAdd}>M+</Button>
            <Button variant="outline" size="sm" onClick={memorySubtract}>M-</Button>
            <Button variant="outline" size="sm" onClick={memoryRecall}>MR</Button>
            <Button variant="outline" size="sm" onClick={memoryClear}>MC</Button>
          </div>

          {/* Number pad */}
          <div className="grid grid-cols-4 gap-2 p-2">
            {/* Row 1 */}
            <Button variant="outline" onClick={clear} className="col-span-2">AC</Button>
            <Button variant="outline" onClick={backspace}>
              <Delete className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => handleInput('÷')}>÷</Button>

            {/* Row 2 */}
            <Button variant="outline" onClick={() => handleInput('7')}>7</Button>
            <Button variant="outline" onClick={() => handleInput('8')}>8</Button>
            <Button variant="outline" onClick={() => handleInput('9')}>9</Button>
            <Button variant="outline" onClick={() => handleInput('×')}>×</Button>

            {/* Row 3 */}
            <Button variant="outline" onClick={() => handleInput('4')}>4</Button>
            <Button variant="outline" onClick={() => handleInput('5')}>5</Button>
            <Button variant="outline" onClick={() => handleInput('6')}>6</Button>
            <Button variant="outline" onClick={() => handleInput('-')}>−</Button>

            {/* Row 4 */}
            <Button variant="outline" onClick={() => handleInput('1')}>1</Button>
            <Button variant="outline" onClick={() => handleInput('2')}>2</Button>
            <Button variant="outline" onClick={() => handleInput('3')}>3</Button>
            <Button variant="outline" onClick={() => handleInput('+')}>+</Button>

            {/* Row 5 */}
            <Button variant="outline" onClick={() => handleInput('0')} className="col-span-2">0</Button>
            <Button variant="outline" onClick={() => handleInput('.')}>.</Button>
            <Button variant="premium" onClick={calculate}>=</Button>
          </div>

          {/* History */}
          {history.length > 0 && (
            <div className="border-t border-border p-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium">History</span>
                <button
                  onClick={() => setHistory([])}
                  className="rounded p-1 text-xs hover:bg-muted"
                >
                  <RotateCcw className="h-3 w-3" />
                </button>
              </div>
              <div className="max-h-20 overflow-y-auto space-y-1">
                {history.slice(-5).reverse().map((entry, idx) => (
                  <div key={idx} className="text-xs text-muted-foreground">
                    {entry}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Draggable>
  );
}
