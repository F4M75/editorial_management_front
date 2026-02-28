import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { useArticles } from '@/hooks/useArticles';
import { useCategories } from '@/hooks/useCategories';
import { useNetworks } from '@/hooks/useNetworks';
import { articleService } from '@/services/article.service';
import ArticleFiltersBar from '@/components/articles/ArticleFiltersBar';
import ArticleTable, { type SortKey } from '@/components/articles/ArticleTable';
import BulkActionsBar from '@/components/articles/BulkActionsBar';
import { Button } from '@/components/ui/button';
import type { ArticleStatus } from '@/types';

const LIMIT = 20;

const DEFAULT_FILTERS = {
  search: '',
  status: 'all',
  networkId: 'all',
  selectedCategories: [] as string[],
  featuredOnly: false,
};

const ArticlesPage = () => {
  const navigate = useNavigate();

  // ── Filters ──────────────────────────────────────────────────────────────
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const debouncedSearch = useDebounce(filters.search, 400);

  // ── Sort ─────────────────────────────────────────────────────────────────
  const [sortBy, setSortBy] = useState<SortKey>('publishedAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // ── Pagination ───────────────────────────────────────────────────────────
  const [page, setPage] = useState(1);

  // ── Selection ────────────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);

  // ── Data ─────────────────────────────────────────────────────────────────
  const { articles, meta, isLoading, refresh } = useArticles({
    search: debouncedSearch || undefined,
    status: filters.status !== 'all' ? (filters.status as ArticleStatus) : undefined,
    networkId: filters.networkId !== 'all' ? filters.networkId : undefined,
    featured: filters.featuredOnly ? true : undefined,
    page,
    limit: LIMIT,
  });
  const { categories } = useCategories();
  const { networks } = useNetworks();

  // ── Client-side category filter + sort ───────────────────────────────────
  const processedArticles = useMemo(() => {
    let result = [...articles];

    if (filters.selectedCategories.length > 0) {
      result = result.filter((a) =>
        a.categories.some((c) => filters.selectedCategories.includes(c.category.id))
      );
    }

    result.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'title') cmp = a.title.localeCompare(b.title);
      else if (sortBy === 'status') cmp = a.status.localeCompare(b.status);
      else if (sortBy === 'network') cmp = a.network.name.localeCompare(b.network.name);
      else if (sortBy === 'publishedAt') {
        cmp = new Date(a.publishedAt ?? 0).getTime() - new Date(b.publishedAt ?? 0).getTime();
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [articles, filters.selectedCategories, sortBy, sortDir]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleFilterChange = (partial: Partial<typeof DEFAULT_FILTERS>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
    setPage(1);
    setSelectedIds([]);
  };

  const handleSort = (col: SortKey) => {
    if (sortBy === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(col); setSortDir('asc'); }
  };

  const handleSelect = (id: string) =>
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);

  const handleDelete = async (id: string) => {
    await articleService.delete(id);
    setSelectedIds((prev) => prev.filter((i) => i !== id));
    toast.success('Article supprimé');
    void refresh();
  };

  const handleStatusChange = async (id: string, status: ArticleStatus) => {
    await articleService.changeStatus(id, status);
    toast.success('Statut mis à jour');
    void refresh();
  };

  const handleToggleFeatured = async (id: string, featured: boolean) => {
    await articleService.update(id, { featured });
    toast.success(featured ? 'Article mis en avant' : 'Mise en avant retirée');
    void refresh();
  };

  const handleBulkStatusChange = async (status: ArticleStatus) => {
    setBulkLoading(true);
    try {
      await Promise.all(selectedIds.map((id) => articleService.changeStatus(id, status)));
      toast.success(`${selectedIds.length} article(s) mis à jour`);
      setSelectedIds([]);
      void refresh();
    } catch {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Articles</h1>
          <p className="text-sm text-gray-500 mt-1">
            {meta ? `${meta.total} article${meta.total > 1 ? 's' : ''}` : '—'}
          </p>
        </div>
        <Button onClick={() => navigate('/articles/new')} className="gap-2">
          <Plus size={16} /> Nouvel article
        </Button>
      </div>

      {/* Filters */}
      <ArticleFiltersBar
        filters={filters}
        categories={categories}
        networks={networks}
        onChange={handleFilterChange}
        onReset={() => { setFilters(DEFAULT_FILTERS); setPage(1); setSelectedIds([]); }}
      />

      {/* Bulk actions */}
      {selectedIds.length > 0 && (
        <BulkActionsBar
          count={selectedIds.length}
          isLoading={bulkLoading}
          onStatusChange={handleBulkStatusChange}
          onClear={() => setSelectedIds([])}
        />
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <ArticleTable
          articles={processedArticles}
          isLoading={isLoading}
          selectedIds={selectedIds}
          sortBy={sortBy}
          sortDir={sortDir}
          onSort={handleSort}
          onSelect={handleSelect}
          onSelectAll={setSelectedIds}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
          onToggleFeatured={handleToggleFeatured}
        />
      </div>

      {/* Pagination */}
      {meta && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            {meta.total === 0
              ? 'Aucun article'
              : `${(meta.page - 1) * LIMIT + 1}–${Math.min(meta.page * LIMIT, meta.total)} sur ${meta.total}`}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft size={16} />
            </Button>
            {Array.from({ length: meta.totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === meta.totalPages || Math.abs(p - page) <= 1)
              .reduce<(number | '...')[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...');
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === '...' ? (
                  <span key={`ellipsis-${i}`} className="px-1">…</span>
                ) : (
                  <Button
                    key={p}
                    variant={p === page ? 'default' : 'outline'}
                    size="sm"
                    className="w-8"
                    onClick={() => setPage(p as number)}
                  >
                    {p}
                  </Button>
                )
              )}
            <Button
              variant="outline"
              size="sm"
              disabled={page === meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArticlesPage;
