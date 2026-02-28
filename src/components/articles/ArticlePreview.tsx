import { Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Category, Network } from '@/types';

interface ArticlePreviewProps {
  title: string;
  excerpt: string;
  content: string;
  author: string;
  featured: boolean;
  categories: Category[];
  network: Network | null;
}

const ArticlePreview = ({ title, excerpt, content, author, featured, categories, network }: ArticlePreviewProps) => {
  return (
    <div className="bg-white rounded-xl border overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="px-5 py-3 border-b bg-gray-50 flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Prévisualisation</span>
        {featured && (
          <span className="flex items-center gap-1 text-xs text-yellow-600 font-medium">
            <Star size={12} className="fill-yellow-400 text-yellow-400" /> Mis en avant
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 space-y-4">
        {/* Categories */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <span
                key={cat.id}
                className="text-xs px-2.5 py-1 rounded-full font-medium text-white"
                style={{ backgroundColor: cat.color }}
              >
                {cat.name}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">
          {title || <span className="text-gray-300">Titre de l'article</span>}
        </h1>

        {/* Meta */}
        <div className="flex items-center gap-2 text-sm text-gray-400">
          {author && <span>Par <span className="font-medium text-gray-600">{author}</span></span>}
          {network && (
            <>
              <span>·</span>
              <Badge variant="outline" className="text-xs">{network.name}</Badge>
            </>
          )}
        </div>

        {/* Excerpt */}
        {excerpt && (
          <p className="text-gray-500 italic border-l-4 border-gray-200 pl-4 text-sm leading-relaxed">
            {excerpt}
          </p>
        )}

        {/* Body */}
        {content && content !== '<p></p>' ? (
          <div
            className="prose prose-sm max-w-none text-gray-700"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        ) : (
          <p className="text-gray-300 text-sm">Le contenu apparaîtra ici...</p>
        )}
      </div>
    </div>
  );
};

export default ArticlePreview;
