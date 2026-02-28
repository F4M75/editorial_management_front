import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold, Italic, Strikethrough, List, ListOrdered,
  Heading2, Heading3, Quote, Undo, Redo,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  error?: string;
}

const ToolbarButton = ({
  onClick,
  active,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onMouseDown={(e) => { e.preventDefault(); onClick(); }}
    className={cn(
      'p-1.5 rounded hover:bg-gray-100 transition-colors',
      active && 'bg-gray-200 text-gray-900'
    )}
  >
    {children}
  </button>
);

const RichTextEditor = ({ value, onChange, error }: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Rédigez le contenu de votre article...' }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  if (!editor) return null;

  return (
    <div className={cn('border rounded-lg overflow-hidden', error && 'border-red-400')}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b bg-gray-50">
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')}>
          <Bold size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')}>
          <Italic size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')}>
          <Strikethrough size={15} />
        </ToolbarButton>

        <div className="w-px h-5 bg-gray-300 mx-1" />

        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })}>
          <Heading2 size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })}>
          <Heading3 size={15} />
        </ToolbarButton>

        <div className="w-px h-5 bg-gray-300 mx-1" />

        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')}>
          <List size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')}>
          <ListOrdered size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')}>
          <Quote size={15} />
        </ToolbarButton>

        <div className="w-px h-5 bg-gray-300 mx-1" />

        <ToolbarButton onClick={() => editor.chain().focus().undo().run()}>
          <Undo size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()}>
          <Redo size={15} />
        </ToolbarButton>
      </div>

      {/* Editor */}
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none min-h-56 px-4 py-3 focus-within:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-gray-400 [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0"
      />
    </div>
  );
};

export default RichTextEditor;
