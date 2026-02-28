import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FileText, CheckCircle, Clock, Archive, Bell } from 'lucide-react';
import { useStats } from '@/hooks/useStats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

const StatCard = ({ title, value, icon, color }: StatCardProps) => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color}`}>{icon}</div>
      </div>
    </CardContent>
  </Card>
);

// ─── Status Badge ─────────────────────────────────────────────────────────────

const statusConfig = {
  published: { label: 'Publié', className: 'bg-green-100 text-green-700' },
  draft: { label: 'Brouillon', className: 'bg-yellow-100 text-yellow-700' },
  archived: { label: 'Archivé', className: 'bg-gray-100 text-gray-600' },
} as const;

// ─── Skeleton rows ────────────────────────────────────────────────────────────

const SkeletonRows = ({ count = 5 }: { count?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <Skeleton key={i} className="h-10 w-full rounded-md" />
    ))}
  </div>
);

// ─── Dashboard ────────────────────────────────────────────────────────────────

const DashboardPage = () => {
  const { stats, isLoading } = useStats();

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Vue d'ensemble de votre activité éditoriale</p>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : (
          <>
            <StatCard
              title="Total articles"
              value={stats?.articles.total ?? 0}
              icon={<FileText size={20} className="text-blue-600" />}
              color="bg-blue-50"
            />
            <StatCard
              title="Publiés"
              value={stats?.articles.published ?? 0}
              icon={<CheckCircle size={20} className="text-green-600" />}
              color="bg-green-50"
            />
            <StatCard
              title="Brouillons"
              value={stats?.articles.draft ?? 0}
              icon={<Clock size={20} className="text-yellow-600" />}
              color="bg-yellow-50"
            />
            <StatCard
              title="Archivés"
              value={stats?.articles.archived ?? 0}
              icon={<Archive size={20} className="text-gray-500" />}
              color="bg-gray-100"
            />
          </>
        )}
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie chart — categories */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Répartition par catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={stats?.byCategory}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {stats?.byCategory.map((entry) => (
                      <Cell key={entry.id} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`${value} article(s)`, '']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Articles by network */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Articles par réseau</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <SkeletonRows count={3} />
            ) : (
              stats?.byNetwork.map((n) => {
                const pct = stats.articles.total > 0
                  ? Math.round((n.count / stats.articles.total) * 100)
                  : 0;
                return (
                  <div key={n.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{n.name}</span>
                      <span className="text-gray-500">{n.count} article{n.count > 1 ? 's' : ''}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#1a1a2e] rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Bottom Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent articles */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">5 derniers articles publiés</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <SkeletonRows />
            ) : stats?.recentArticles.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Aucun article publié</p>
            ) : (
              <div className="space-y-3">
                {stats?.recentArticles.map((article) => (
                  <div
                    key={article.id}
                    className="flex items-start justify-between gap-3 py-2 border-b last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{article.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {article.author} · {article.network.name}
                      </p>
                    </div>
                    <Badge className={statusConfig[article.status].className} variant="outline">
                      {statusConfig[article.status].label}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dernières notifications</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <SkeletonRows />
            ) : stats?.recentNotifications.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Aucune notification envoyée</p>
            ) : (
              <div className="space-y-3">
                {stats?.recentNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="flex items-start gap-3 py-2 border-b last:border-0"
                  >
                    <div className="mt-0.5 p-1.5 rounded-full bg-blue-50">
                      <Bell size={14} className="text-blue-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800 truncate">{notif.subject}</p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">
                        {notif.article.title}
                      </p>
                      <p className="text-xs text-gray-400">
                        {notif.recipients.length} destinataire{notif.recipients.length > 1 ? 's' : ''} ·{' '}
                        {new Date(notif.sentAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        notif.status === 'sent'
                          ? 'bg-green-50 text-green-600'
                          : 'bg-red-50 text-red-500'
                      }
                    >
                      {notif.status === 'sent' ? 'Envoyé' : 'Échec'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
