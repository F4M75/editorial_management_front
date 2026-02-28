import { useState } from 'react';
import {
  MoreHorizontal, ArrowUpDown, ArrowUp, ArrowDown,
  Pencil, Trash2, Archive, Star, StarOff, CheckCircle,
} from 'lucide-react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import type { Article, ArticleStatus } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SortKey = 'title' | 'publishedAt' | 'status' | 'network';

interface ArticleTableProps {
  articles: Article[];
  isLoading: boolean;
  selectedIds: string[];
  sortBy: SortKey;
  sortDir: 'asc' | 'desc';
  onSort: (key: SortKey) => void;
  onSelect: (id: string) => void;
  onSelectAll: (ids: string[]) => void;
  onDelete: (id: string) => Promise<void>;
  onStatusChange: (id: string, status: ArticleStatus) => Promise<void>;
  onToggleFeatured: (id: string, featured: boolean) => Promise<void>;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const statusConfig: Record<ArticleStatus, { label: string; className: string }> = {
  published: { label: 'Publié',    className: 'bg-green-100 text-green-700 border-green-200' },
  draft:     { label: 'Brouillon', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  archived:  { label: 'Archivé',   className: 'bg-gray-100 text-gray-500 border-gray-200' },
};

// ─── Sort Icon ────────────────────────────────────────────────────────────────

const SortIcon = ({ col, sortBy, sortDir }: { col: SortKey; sortBy: SortKey; sortDir: 'asc' | 'desc' }) => {
  if (sortBy !== col) return <ArrowUpDown size={14} className="ml-1 opacity-30" />;
  return sortDir === 'asc'
    ? <ArrowUp size={14} className="ml-1 text-[#1a1a2e]" />
    : <ArrowDown size={14} className="ml-1 text-[#1a1a2e]" />;
};

// ─── Component ────────────────────────────────────────────────────────────────

const ArticleTable = ({
  articles, isLoading, selectedIds, sortBy, sortDir,
  onSort, onSelect, onSelectAll, onDelete, onStatusChange, onToggleFeatured,
}: ArticleTableProps) => {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const allSelected = articles.length > 0 && articles.every((a) => selectedIds.includes(a.id));

  const SortHeader = ({ col, label }: { col: SortKey; label: string }) => (
    <button
      className="flex items-center hover:text-gray-900 transition-colors"
      onClick={() => onSort(col)}
    >
      {label}
      <SortIcon col={col} sortBy={sortBy} sortDir={sortDir} />
    </button>
  );

  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="font-medium">Aucun article trouvé</p>
        <p className="text-sm mt-1">Modifiez vos filtres ou créez un nouvel article</p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="w-10">
              <Checkbox
                checked={allSelected}
                onCheckedChange={(v) =>
                  onSelectAll(v ? articles.map((a) => a.id) : [])
                }
              />
            </TableHead>
            <TableHead><SortHeader col="title" label="Titre" /></TableHead>
            <TableHead><SortHeader col="status" label="Statut" /></TableHead>
            <TableHead><SortHeader col="network" label="Réseau" /></TableHead>
            <TableHead>Catégories</TableHead>
            <TableHead>Auteur</TableHead>
            <TableHead><SortHeader col="publishedAt" label="Date" /></TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {articles.map((article) => (
            <TableRow
              key={article.id}
              className={selectedIds.includes(article.id) ? 'bg-blue-50/50' : ''}
            >
              <TableCell>
                <Checkbox
                  checked={selectedIds.includes(article.id)}
                  onCheckedChange={() => onSelect(article.id)}
                />
              </TableCell>

              {/* Title */}
              <TableCell className="max-w-64">
                <div className="flex items-center gap-2">
                  {article.featured && (
                    <Star size={14} className="text-yellow-400 shrink-0 fill-yellow-400" />
                  )}
                  <span className="font-medium text-gray-900 truncate">{article.title}</span>
                </div>
                <p className="text-xs text-gray-400 truncate mt-0.5">{article.excerpt}</p>
              </TableCell>

              {/* Status */}
              <TableCell>
                <Badge variant="outline" className={statusConfig[article.status].className}>
                  {statusConfig[article.status].label}
                </Badge>
              </TableCell>

              {/* Network */}
              <TableCell className="text-sm text-gray-600">{article.network.name}</TableCell>

              {/* Categories */}
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {article.categories.slice(0, 2).map(({ category }) => (
                    <span
                      key={category.id}
                      className="text-xs px-2 py-0.5 rounded-full text-white font-medium"
                      style={{ backgroundColor: category.color }}
                    >
                      {category.name}
                    </span>
                  ))}
                  {article.categories.length > 2 && (
                    <span className="text-xs text-gray-400">+{article.categories.length - 2}</span>
                  )}
                </div>
              </TableCell>

              {/* Author */}
              <TableCell className="text-sm text-gray-600">{article.author}</TableCell>

              {/* Date */}
              <TableCell className="text-sm text-gray-500 whitespace-nowrap">
                {article.publishedAt
                  ? new Date(article.publishedAt).toLocaleDateString('fr-FR')
                  : '—'}
              </TableCell>

              {/* Actions */}
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="gap-2">
                      <Pencil size={14} /> Éditer
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      className="gap-2"
                      onClick={() => onToggleFeatured(article.id, !article.featured)}
                    >
                      {article.featured
                        ? <><StarOff size={14} /> Retirer la mise en avant</>
                        : <><Star size={14} /> Mettre en avant</>}
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    {article.status !== 'published' && (
                      <DropdownMenuItem
                        className="gap-2 text-green-600"
                        onClick={() => onStatusChange(article.id, 'published')}
                      >
                        <CheckCircle size={14} /> Publier
                      </DropdownMenuItem>
                    )}
                    {article.status !== 'archived' && (
                      <DropdownMenuItem
                        className="gap-2 text-gray-500"
                        onClick={() => onStatusChange(article.id, 'archived')}
                      >
                        <Archive size={14} /> Archiver
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      className="gap-2 text-red-500 focus:text-red-500"
                      onClick={() => setDeleteId(article.id)}
                    >
                      <Trash2 size={14} /> Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'article ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'article sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={async () => {
                if (deleteId) await onDelete(deleteId);
                setDeleteId(null);
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ArticleTable;
