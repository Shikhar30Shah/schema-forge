import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { logoutUser } from '../features/auth/authSlice';
import {
  generateCode,
  generateFromImage as generateFromImageThunk,
  setSource,
  setStatus,
  setInputError,
  setPendingEntry,
  clearPendingEntry,
  applyEntry,
} from '../features/generation/generationSlice';
import { type SchemaTemplate } from '../data/templates';
import type { AppDispatch, RootState } from '../store/store';

export function useSchemaEditor() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { user, token, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { source, models, routes, validators, services, status, inputError, pendingEntry } = useSelector(
    (state: RootState) => state.generation,
  );

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selectedTab, setSelectedTab] = useState('models');
  const [isImageModalOpen, setImageModalOpen] = useState(false);

  const tabs = [
    { id: 'models', label: 'Models', content: models },
    { id: 'routes', label: 'Routes', content: routes },
    { id: 'validators', label: 'Validators', content: validators },
    { id: 'services', label: 'Services', content: services }, // Placeholder for services tab
  ];

  const currentTabContent = tabs.find((tab) => tab.id === selectedTab)?.content || '';
  const isReadyForGenerate = useMemo(() => source.trim().length > 0, [source]);

  // Apply a history entry staged from the /history page.
  useEffect(() => {
    if (!pendingEntry) {
      return;
    }
    dispatch(applyEntry(pendingEntry));
    dispatch(clearPendingEntry());
    setSelectedTab('models');
  }, [pendingEntry, dispatch]);

  const setValueAndCursor = (value: string, cursor: number) => {
    dispatch(setSource(value));
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = cursor;
        textareaRef.current.selectionEnd = cursor;
      }
    });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentTabContent);
      dispatch(setStatus('copied'));
      setTimeout(() => dispatch(setStatus('ready')), 2000);
    } catch {
      dispatch(setStatus('error'));
    }
  };

  const handleGenerateCode = () => {
    if (!isReadyForGenerate) {
      dispatch(setStatus('error'));
      return;
    }
    void dispatch(generateCode({ source, token }));
  };

  const generateFromImage = async (imageBase64: string, mimeType: string) => {
    await dispatch(generateFromImageThunk({ image: imageBase64, mimeType, token }));
  };

  const TAB = '    '; // 4 spaces

  const PAIRS: Record<string, string> = {
    '{': '}',
    '[': ']',
    '(': ')',
    '"': '"',
    "'": "'",
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;

    const { value, selectionStart, selectionEnd } = textarea;

    const before = value.slice(0, selectionStart);
    const selected = value.slice(selectionStart, selectionEnd);
    const after = value.slice(selectionEnd);

    // ---------------- Tab ----------------

    if (e.key === 'Tab') {
      e.preventDefault();
      const newValue = before + TAB + after;
      setValueAndCursor(newValue, selectionStart + TAB.length);
      return;
    }

    // ---------------- Enter ----------------

    if (e.key === 'Enter') {
      e.preventDefault();

      const currentLine = before.substring(before.lastIndexOf('\n') + 1);

      const indent = currentLine.match(/^\s*/)?.[0] ?? '';

      const previousChar = before.at(-1);
      const nextChar = after.at(0);

      // Pressing Enter between {}
      if (previousChar === '{' && nextChar === '}') {
        const insert = '\n' + indent + TAB + '\n' + indent;
        const newValue = before + insert + after;
        setValueAndCursor(newValue, before.length + 1 + indent.length + TAB.length);
        return;
      }

      // Normal indentation
      let extraIndent = '';
      if (previousChar === '{' || previousChar === '[' || previousChar === '(') {
        extraIndent = TAB;
      }

      const insert = '\n' + indent + extraIndent;
      const newValue = before + insert + after;
      setValueAndCursor(newValue, before.length + insert.length);
      return;
    }

    // ---------------- Auto Pair ----------------
    if (PAIRS[e.key]) {
      e.preventDefault();
      const closing = PAIRS[e.key];
      // Wrap selected text
      if (selectionStart !== selectionEnd) {
        const newValue = before + e.key + selected + closing + after;
        setValueAndCursor(newValue, selectionEnd + 2);
        return;
      }

      // Skip duplicate closing quotes
      if ((e.key === '"' || e.key === "'") && after.startsWith(closing)) {
        setValueAndCursor(value, selectionStart + 1);
        return;
      }
      const newValue = before + e.key + closing + after;
      setValueAndCursor(newValue, selectionStart + 1);
      return;
    }

    // ---------------- Skip existing closing bracket ----------------
    if (['}', ']', ')', '"', "'"].includes(e.key)) {
      if (after.startsWith(e.key)) {
        e.preventDefault();
        setValueAndCursor(value, selectionStart + 1);
        return;
      }
    }

    // ---------------- Backspace ----------------
    if (e.key === 'Backspace') {
      const prev = before.at(-1);
      const next = after.at(0);
      if (
        (prev === '{' && next === '}') ||
        (prev === '[' && next === ']') ||
        (prev === '(' && next === ')') ||
        (prev === '"' && next === '"') ||
        (prev === "'" && next === "'")
      ) {
        e.preventDefault();
        const newValue = value.slice(0, selectionStart - 1) + value.slice(selectionStart + 1);
        setValueAndCursor(newValue, selectionStart - 1);
        return;
      }
    }
  };

  const handleSourceChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    dispatch(setSource(e.target.value));
    dispatch(setInputError(null));
  };

  const loadTemplate = useCallback((template: SchemaTemplate) => {
    // Convert the template schema to a JSON string for the source field
    const sourceContent = template.schema
      ? JSON.stringify(template.schema, null, 2)
      : `// ${template.name}\n// ${template.description}\n// TODO: define your schema here`;
    dispatch(setSource(sourceContent));
    dispatch(setInputError(null));
  }, [dispatch]);

  const handleSourceBlur = () => {
    try {
      const parsed = JSON.parse(source);
      dispatch(setSource(JSON.stringify(parsed, null, 4)));
      dispatch(setInputError(null));
    } catch {
      dispatch(setInputError('Invalid JSON — please fix the source before generating.'));
    }
  };

  const handleLogout = async () => {
    await dispatch(logoutUser(token));
  };

  return {
    source,
    models,
    routes,
    validators,
    tabs,
    selectedTab,
    setSelectedTab,
    currentTabContent,
    status,
    inputError,
    textareaRef,
    isReadyForGenerate,
    isImageModalOpen,
    openImageModal: () => setImageModalOpen(true),
    closeImageModal: () => setImageModalOpen(false),
    loadTemplate,
    user,
    isAuthenticated,
    token,
    handleKeyDown,
    handleSourceChange,
    handleSourceBlur,
    handleCopy,
    handleGenerateCode,
    generateFromImage,
    handleLogout,
    router,
  };
}

export type SchemaEditor = ReturnType<typeof useSchemaEditor>;
