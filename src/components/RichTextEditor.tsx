'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { Bold, Italic, Underline, List, ListOrdered, Link as LinkIcon, Heading1, Heading2, Type } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  minHeight?: string;
  className?: string;
  id?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  onBlur,
  placeholder = 'Saisissez votre texte...',
  minHeight = '120px',
  className = '',
  id,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }
    const current = el.innerHTML;
    const normalized = value || '';
    if (current !== normalized) {
      el.innerHTML = normalized || '';
    }
  }, [value]);

  const emitChange = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    isInternalChange.current = true;
    const html = el.innerHTML;
    onChange(html === '<br>' ? '' : html);
  }, [onChange]);

  const handleInput = useCallback(() => {
    emitChange();
  }, [emitChange]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  }, []);

  const exec = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    emitChange();
  }, [emitChange]);

  const addLink = useCallback(() => {
    const url = window.prompt('URL du lien:', 'https://');
    if (url != null && url.trim()) {
      exec('createLink', url.trim());
    }
  }, [exec]);

  const formatBlock = useCallback(
    (tag: string) => {
      document.execCommand('formatBlock', false, tag);
      editorRef.current?.focus();
      emitChange();
    },
    [emitChange]
  );

  return (
    <div
      className={`rounded-lg border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent ${className}`}
    >
      {/* Barre d'outils type mini éditeur (gras, titres, listes, lien) */}
      <div className="flex flex-wrap items-center gap-px border-b border-gray-300 bg-gray-50 p-1.5">
        {/* Titres et paragraphe */}
        <button
          type="button"
          onClick={() => formatBlock('p')}
          className="p-2 rounded hover:bg-gray-200 text-gray-700 flex items-center gap-1.5"
          title="Paragraphe"
          aria-label="Paragraphe"
        >
          <Type className="w-4 h-4" />
          <span className="text-xs hidden sm:inline">Paragraphe</span>
        </button>
        <button
          type="button"
          onClick={() => formatBlock('h2')}
          className="p-2 rounded hover:bg-gray-200 text-gray-700 flex items-center gap-1.5"
          title="Titre principal"
          aria-label="Titre principal"
        >
          <Heading1 className="w-4 h-4" />
          <span className="text-xs hidden sm:inline">Titre</span>
        </button>
        <button
          type="button"
          onClick={() => formatBlock('h3')}
          className="p-2 rounded hover:bg-gray-200 text-gray-700 flex items-center gap-1.5"
          title="Sous-titre"
          aria-label="Sous-titre"
        >
          <Heading2 className="w-4 h-4" />
          <span className="text-xs hidden sm:inline">Sous-titre</span>
        </button>
        <span className="w-px h-5 bg-gray-300 mx-0.5" aria-hidden />
        {/* Style de texte */}
        <button
          type="button"
          onClick={() => exec('bold')}
          className="p-2 rounded hover:bg-gray-200 text-gray-700"
          title="Gras"
          aria-label="Gras"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => exec('italic')}
          className="p-2 rounded hover:bg-gray-200 text-gray-700"
          title="Italique"
          aria-label="Italique"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => exec('underline')}
          className="p-2 rounded hover:bg-gray-200 text-gray-700"
          title="Souligné"
          aria-label="Souligné"
        >
          <Underline className="w-4 h-4" />
        </button>
        <span className="w-px h-5 bg-gray-300 mx-0.5" aria-hidden />
        {/* Listes */}
        <button
          type="button"
          onClick={() => exec('insertUnorderedList')}
          className="p-2 rounded hover:bg-gray-200 text-gray-700"
          title="Liste à puces"
          aria-label="Liste à puces"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => exec('insertOrderedList')}
          className="p-2 rounded hover:bg-gray-200 text-gray-700"
          title="Liste numérotée"
          aria-label="Liste numérotée"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <span className="w-px h-5 bg-gray-300 mx-0.5" aria-hidden />
        <button
          type="button"
          onClick={addLink}
          className="p-2 rounded hover:bg-gray-200 text-gray-700"
          title="Insérer un lien"
          aria-label="Insérer un lien"
        >
          <LinkIcon className="w-4 h-4" />
        </button>
      </div>
      {/* Zone d'édition */}
      <div className="relative">
        <div
          ref={editorRef}
          id={id}
          contentEditable
          role="textbox"
          aria-multiline="true"
          className="w-full px-3 py-2 text-gray-900 bg-white outline-none overflow-y-auto prose prose-sm max-w-none min-w-0
            [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-1
            [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-3 [&_h2]:mb-1
            [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1"
          style={{ minHeight }}
        onInput={handleInput}
        onFocus={() => setFocused(true)}
        onBlur={() => { setFocused(false); onBlur?.(); }}
        onPaste={handlePaste}
        suppressContentEditableWarning
        />
        {(!value || value.replace(/<[^>]*>/g, '').trim() === '') && !focused && (
          <span
            className="absolute left-3 top-2 text-gray-400 pointer-events-none text-sm"
            aria-hidden
          >
            {placeholder}
          </span>
        )}
      </div>
    </div>
  );
}
