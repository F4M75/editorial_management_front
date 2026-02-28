import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import MultiSelect from '@/components/common/MultiSelect';
import type { Category, Network } from '@/types';

interface Filters {
  search: string;
  status: string;
  networkId: string;
  selectedCategories: string[];
  featuredOnly: boolean;
}

interface ArticleFiltersBarProps {
  filters: Filters;
  categories: Category[];
  networks: Network[];
  onChange: (filters: Partial<Filters>) => void;
  onReset: () => void;
}

const ArticleFiltersBar = ({ filters, categories, networks, onChange, onReset }: ArticleFiltersBarProps) => {
  const hasActiveFilters =
    filters.search !== '' ||
    filters.status !== 'all' ||
    filters.networkId !== 'all' ||
    filters.selectedCategories.length > 0 ||
    filters.featuredOnly;

  return (
    <div className="bg-white border rounded-xl p-4 space-y-3">
      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Rechercher par titre ou contenu..."
          className="pl-9"
          value={filters.search}
          onChange={(e) => onChange({ search: e.target.value })}
        />
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Status */}
        <Select value={filters.status} onValueChange={(v) => onChange({ status: v })}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="published">Publié</SelectItem>
            <SelectItem value="draft">Brouillon</SelectItem>
            <SelectItem value="archived">Archivé</SelectItem>
          </SelectContent>
        </Select>

        {/* Network */}
        <Select value={filters.networkId} onValueChange={(v) => onChange({ networkId: v })}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Réseau" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les réseaux</SelectItem>
            {networks.map((n) => (
              <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Categories multi-select */}
        <MultiSelect
          options={categories.map((c) => ({ value: c.id, label: c.name, color: c.color }))}
          selected={filters.selectedCategories}
          onChange={(v) => onChange({ selectedCategories: v })}
          placeholder="Catégories"
        />

        {/* Featured */}
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <Checkbox
            checked={filters.featuredOnly}
            onCheckedChange={(v) => onChange({ featuredOnly: !!v })}
          />
          <span className="text-sm text-gray-600">Mis en avant</span>
        </label>

        {/* Reset */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" className="gap-1 text-gray-500" onClick={onReset}>
            <X size={14} />
            Réinitialiser
          </Button>
        )}
      </div>
    </div>
  );
};

export default ArticleFiltersBar;
