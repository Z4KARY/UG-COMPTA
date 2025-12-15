import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { Toggle } from "@/components/ui/toggle";
import { useEffect, useState } from "react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Code2,
  Minus,
  Undo2,
  Redo2,
  Eraser,
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const toggleClasses =
  "h-8 w-8 rounded-lg border border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors data-[state=on]:bg-primary/10 data-[state=on]:text-primary";
const toolbarGroupClasses =
  "flex items-center gap-1 rounded-2xl border border-border/60 bg-white/95 p-1";
const actionButtonClasses =
  "flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors disabled:cursor-not-allowed disabled:opacity-40";

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  className,
}: RichTextEditorProps) {
  const [stats, setStats] = useState({ words: 0, chars: 0 });
  const placeholderText =
    placeholder || "Commencez votre document juridique personnalisé...";
  const updateStats = (editorInstance: Editor) => {
    const text = editorInstance.getText();
    const trimmed = text.trim();
    setStats({
      words: trimmed ? trimmed.split(/\s+/).length : 0,
      chars: text.length,
    });
  };

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class:
          "min-h-[900px] w-full bg-transparent px-10 py-12 text-base leading-relaxed focus:outline-none tiptap-editor",
        spellCheck: "true",
        "aria-label": "Éditeur de document juridique",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
      updateStats(editor);
    },
    onCreate: ({ editor }) => updateStats(editor),
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      if (editor.getText() === "" && value !== "<p></p>") {
        editor.commands.setContent(value);
        updateStats(editor);
      } else if (value !== editor.getHTML()) {
        const currentSelection = editor.state.selection;
        editor.commands.setContent(value);
        editor.commands.setTextSelection(currentSelection);
        updateStats(editor);
      }
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  const canUndo = editor.can().undo();
  const canRedo = editor.can().redo();
  const isCanvasEmpty = editor.isEmpty && editor.getText().length === 0;

  const handleUndo = () => editor.chain().focus().undo().run();
  const handleRedo = () => editor.chain().focus().redo().run();
  const handleInsertDivider = () => editor.chain().focus().setHorizontalRule().run();
  const handleClearFormatting = () =>
    editor.chain().focus().clearNodes().unsetAllMarks().run();

  const alignmentOptions = [
    { value: "left", label: "Aligner à gauche", icon: AlignLeft },
    { value: "center", label: "Centrer", icon: AlignCenter },
    { value: "right", label: "Aligner à droite", icon: AlignRight },
    { value: "justify", label: "Justifier", icon: AlignJustify },
  ] as const;

  return (
    <div className={`space-y-4 ${className || ""}`}>
      <div className="rounded-[30px] border border-border/60 bg-white/80 p-4 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="flex flex-wrap items-center gap-3">
          <div className={toolbarGroupClasses}>
            <button
              type="button"
              onClick={handleUndo}
              disabled={!canUndo}
              className={actionButtonClasses}
              aria-label="Annuler"
            >
              <Undo2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={!canRedo}
              className={actionButtonClasses}
              aria-label="Rétablir"
            >
              <Redo2 className="h-4 w-4" />
            </button>
          </div>

          <div className={toolbarGroupClasses}>
            <Toggle
              size="sm"
              pressed={editor.isActive("bold")}
              onPressedChange={() => editor.chain().focus().toggleBold().run()}
              aria-label="Gras"
              className={toggleClasses}
            >
              <Bold className="h-4 w-4" />
            </Toggle>
            <Toggle
              size="sm"
              pressed={editor.isActive("italic")}
              onPressedChange={() => editor.chain().focus().toggleItalic().run()}
              aria-label="Italique"
              className={toggleClasses}
            >
              <Italic className="h-4 w-4" />
            </Toggle>
            <Toggle
              size="sm"
              pressed={editor.isActive("underline")}
              onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
              aria-label="Souligner"
              className={toggleClasses}
            >
              <UnderlineIcon className="h-4 w-4" />
            </Toggle>
            <Toggle
              size="sm"
              pressed={editor.isActive("strike")}
              onPressedChange={() => editor.chain().focus().toggleStrike().run()}
              aria-label="Barré"
              className={toggleClasses}
            >
              <Strikethrough className="h-4 w-4" />
            </Toggle>
          </div>

          <div className={toolbarGroupClasses}>
            {[1, 2, 3].map((level) => (
              <Toggle
                key={level}
                size="sm"
                pressed={editor.isActive("heading", { level })}
                onPressedChange={() =>
                  editor.chain().focus().toggleHeading({ level }).run()
                }
                aria-label={`Titre ${level}`}
                className={toggleClasses}
              >
                {level === 1 && <Heading1 className="h-4 w-4" />}
                {level === 2 && <Heading2 className="h-4 w-4" />}
                {level === 3 && <Heading3 className="h-4 w-4" />}
              </Toggle>
            ))}
          </div>

          <div className={toolbarGroupClasses}>
            {alignmentOptions.map(({ value, label, icon: Icon }) => (
              <Toggle
                key={value}
                size="sm"
                pressed={editor.isActive({ textAlign: value })}
                onPressedChange={() =>
                  editor.chain().focus().setTextAlign(value).run()
                }
                aria-label={label}
                className={toggleClasses}
              >
                <Icon className="h-4 w-4" />
              </Toggle>
            ))}
          </div>

          <div className={toolbarGroupClasses}>
            <Toggle
              size="sm"
              pressed={editor.isActive("bulletList")}
              onPressedChange={() =>
                editor.chain().focus().toggleBulletList().run()
              }
              aria-label="Liste à puces"
              className={toggleClasses}
            >
              <List className="h-4 w-4" />
            </Toggle>
            <Toggle
              size="sm"
              pressed={editor.isActive("orderedList")}
              onPressedChange={() =>
                editor.chain().focus().toggleOrderedList().run()
              }
              aria-label="Liste numérotée"
              className={toggleClasses}
            >
              <ListOrdered className="h-4 w-4" />
            </Toggle>
            <Toggle
              size="sm"
              pressed={editor.isActive("blockquote")}
              onPressedChange={() =>
                editor.chain().focus().toggleBlockquote().run()
              }
              aria-label="Citation"
              className={toggleClasses}
            >
              <Quote className="h-4 w-4" />
            </Toggle>
            <Toggle
              size="sm"
              pressed={editor.isActive("codeBlock")}
              onPressedChange={() =>
                editor.chain().focus().toggleCodeBlock().run()
              }
              aria-label="Bloc de code"
              className={toggleClasses}
            >
              <Code2 className="h-4 w-4" />
            </Toggle>
          </div>

          <div className={toolbarGroupClasses}>
            <button
              type="button"
              onClick={handleInsertDivider}
              className={actionButtonClasses}
              aria-label="Insérer un séparateur"
            >
              <Minus className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleClearFormatting}
              className={actionButtonClasses}
              aria-label="Effacer le formatage"
            >
              <Eraser className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-[36px] border border-border/70 bg-gradient-to-b from-slate-50 to-white p-6">
        <div className="mx-auto w-full max-w-[900px] rounded-[28px] border border-border/60 bg-white">
          <div className="relative">
            {isCanvasEmpty && (
              <p className="pointer-events-none absolute left-10 right-10 top-12 text-base leading-relaxed text-muted-foreground/70">
                {placeholderText}
              </p>
            )}
            <EditorContent editor={editor} />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>
            Mots :{" "}
            <span className="font-semibold text-foreground">{stats.words}</span>
          </span>
          <span>
            Caractères :{" "}
            <span className="font-semibold text-foreground">{stats.chars}</span>
          </span>
          <span className="text-muted-foreground/80">
            Sauvegardes en temps réel activées
          </span>
        </div>
      </div>
    </div>
  );
}