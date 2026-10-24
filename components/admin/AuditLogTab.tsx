'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { FileText, User, MapPin, Trash2, Ban, UserCheck } from 'lucide-react';

type AuditLog = {
  id: string;
  admin_id: string;
  action: string;
  target_type: string;
  target_id: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  admin: {
    full_name: string;
    email: string;
  };
};

const ACTION_ICONS: Record<string, any> = {
  remove_item: Trash2,
  ban_user: Ban,
  unban_user: UserCheck,
  create_location: MapPin,
  update_location: MapPin,
  delete_location: Trash2,
};

const ACTION_COLORS: Record<string, string> = {
  remove_item: 'text-destructive',
  ban_user: 'text-destructive',
  unban_user: 'text-green-600',
  create_location: 'text-blue-600',
  update_location: 'text-blue-600',
  delete_location: 'text-destructive',
};

export function AuditLogTab() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase
        .from('audit_log')
        .select(`
          *,
          admin:profiles!audit_log_admin_id_fkey (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data as unknown as AuditLog[]);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  }

  function formatActionName(action: string): string {
    return action
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  function getMetadataSummary(log: AuditLog): string {
    if (!log.metadata) return '';

    const { reason, title, name, banned_user_name, unbanned_user_name } = log.metadata;

    if (reason) return `Reason: ${reason}`;
    if (title) return `Item: "${title}"`;
    if (name) return `Location: "${name}"`;
    if (banned_user_name) return `User: ${banned_user_name}`;
    if (unbanned_user_name) return `User: ${unbanned_user_name}`;

    return '';
  }

  if (loading) {
    return <div className="text-center py-8">Loading audit logs...</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Audit Log</CardTitle>
          <CardDescription>
            Complete history of all admin actions (last 100 entries)
          </CardDescription>
        </CardHeader>
      </Card>

      {logs.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No audit logs yet
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => {
            const Icon = ACTION_ICONS[log.action] || FileText;
            const colorClass = ACTION_COLORS[log.action] || 'text-muted-foreground';

            return (
              <Card key={log.id}>
                <CardContent className="py-4">
                  <div className="flex items-start gap-3">
                    <Icon className={`h-5 w-5 mt-0.5 ${colorClass}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-medium">{formatActionName(log.action)}</p>
                        <Badge variant="outline" className="capitalize">
                          {log.target_type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        By {log.admin.full_name} ({log.admin.email})
                      </p>
                      {getMetadataSummary(log) && (
                        <p className="text-sm text-muted-foreground">
                          {getMetadataSummary(log)}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
