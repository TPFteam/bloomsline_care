'use client'

import { useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { Bold, Heading2, Quote, List, Minus, Link2, ImagePlus, Loader2 } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/context'

interface Props {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  uploadImage: (file: File) => Promise<string | null>
  uploading?: boolean
}

// Reliable rich editor (TipTap/ProseMirror). Text, headings, quotes, lists and
// real inline images all render as you write — what you see is what publishes.
export function RichBlogEditor({ value, onChange, placeholder, uploadImage, uploading }: Props) {
  const { locale } = useLanguage()
  const L = (en: string, fr: string) => (locale === 'fr' ? fr : en)
  const fileRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    immediatelyRender: false, // Next.js SSR safety
    extensions: [
      StarterKit,
      Image,
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' } }),
      Placeholder.configure({ placeholder: placeholder || 'Write your story…' }),
    ],
    content: value || '',
    editorProps: { attributes: { class: 'blog-content rt-edit min-h-[50vh] outline-none' } },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  })

  if (!editor) return null

  const onPickImage = async (file: File) => {
    const url = await uploadImage(file)
    if (url) editor.chain().focus().setImage({ src: url }).run()
  }

  const onLink = () => {
    const prev = editor.getAttributes('link').href as string | undefined
    const url = window.prompt(L('Link URL', 'URL du lien'), prev || '')
    if (url === null) return
    if (url === '') { editor.chain().focus().extendMarkRange('link').unsetLink().run(); return }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  return (
    <div>
      <div className="flex items-center gap-1 mb-3 border-b border-gray-100 pb-2.5 flex-wrap">
        <TBtn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} icon={<Bold className="w-4 h-4" />} label={L('Bold', 'Gras')} />
        <TBtn active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} icon={<Heading2 className="w-4 h-4" />} label={L('Heading', 'Titre')} />
        <TBtn active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} icon={<List className="w-4 h-4" />} label={L('List', 'Liste')} />
        <TBtn active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} icon={<Quote className="w-4 h-4" />} label={L('Quote', 'Citation')} />
        <TBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} icon={<Minus className="w-4 h-4" />} label={L('Divider', 'Séparateur')} />
        <TBtn active={editor.isActive('link')} onClick={onLink} icon={<Link2 className="w-4 h-4" />} label={L('Link', 'Lien')} />
        <TBtn accent onClick={() => fileRef.current?.click()} icon={uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />} label="Image" />
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onPickImage(e.target.files[0])} />
      </div>

      <EditorContent editor={editor} />

      <style>{`
        .rt-edit:focus { outline: none; }
        .rt-edit p.is-editor-empty:first-child::before {
          content: attr(data-placeholder); color:#d1d5db; float:left; height:0; pointer-events:none;
        }
        .rt-edit img { border-radius:14px; margin:1.2em 0; max-width:100%; height:auto; }
      `}</style>
    </div>
  )
}

function TBtn({ onClick, icon, label, accent, active }: { onClick: () => void; icon: React.ReactNode; label: string; accent?: boolean; active?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        active ? 'bg-gray-100 text-gray-900'
          : accent ? 'text-teal-700 hover:bg-teal-50'
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}
