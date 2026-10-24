'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { removeItem, banUser } from '@/app/actions/admin';
import { Trash2, Ban, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

type Report = {
  id: string;
  item_id: string;
  reporter_id: string;
  reason: string;
  details: string | null;
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
  item: {
    id: string;
    title: string;
    report_type: 'lost' | 'found';
    status: string;
    reporter_id: string;
    reporter: {
      id: string;
      full_name: string;
      email: string;
    };
  };
  reporter: {
    id: string;
    full_name: string;
    email: string;
  };
};

export function ReportsTab() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          item:items!reports_item_id_fkey (
            id,
            title,
            report_type,
            status,
            reporter_id,
            reporter:profiles!items_reporter_id_fkey (
              id,
              full_name,
              email
            )
          ),
          reporter:profiles!reports_reporter_id_fkey (
            id,
            full_name,
            email
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data as unknown as Report[]);
    } catch (err) {
      console.error('Failed to load reports:', err);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveItem(reportId: string, itemId: string) {
    if (!confirm('Remove this item? The poster will be notified.')) return;

    try {
      const result = await removeItem({ 
        item_id: itemId, 
        reason: adminNotes[reportId] || 'Removed due to report' 
      });
      if (!result.success) throw new Error(result.error);

      // Mark report as resolved
      const supabase = createSupabaseBrowserClient();
      await supabase
        .from('reports')
        .update({ status: 'resolved', admin_note: adminNotes[reportId] })
        .eq('id', reportId);

      toast.success('Item removed successfully');
      loadReports();
    } catch (err) {
      console.error('Failed to remove item:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to remove item');
    }
  }

  async function handleBanUser(reportId: string, userId: string, userName: string) {
    if (!confirm(`Ban user ${userName}? They will not be able to post or claim items.`)) return;

    try {
      const result = await banUser({ 
        user_id: userId, 
        reason: adminNotes[reportId] || 'Banned due to report' 
      });
      if (!result.success) throw new Error(result.error);

      // Mark report as resolved
      const supabase = createSupabaseBrowserClient();
      await supabase
        .from('reports')
        .update({ status: 'resolved', admin_note: adminNotes[reportId] })
        .eq('id', reportId);

      toast.success(`User ${userName} banned successfully`);
      loadReports();
    } catch (err) {
      console.error('Failed to ban user:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to ban user');
    }
  }

  async function handleDismiss(reportId: string) {
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase
        .from('reports')
        .update({ status: 'dismissed', admin_note: adminNotes[reportId] || 'No action needed' })
        .eq('id', reportId);

      if (error) throw error;
      toast.success('Report dismissed');
      loadReports();
    } catch (err) {
      console.error('Failed to dismiss report:', err);
      toast.error('Failed to dismiss report');
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading reports...</div>;
  }

  if (reports.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Pending Reports</CardTitle>
          <CardDescription>All reports have been resolved or dismissed.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <AlertTriangle className="h-5 w-5" />
        <p>{reports.length} pending report(s)</p>
      </div>

      {reports.map((report) => (
        <Card key={report.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg">
                  <Link href={`/items/${report.item_id}`} className="hover:underline">
                    {report.item.title}
                  </Link>
                </CardTitle>
                <CardDescription>
                  Reported {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })} by{' '}
                  <span className="font-medium">{report.reporter.full_name}</span>
                </CardDescription>
              </div>
              <Badge variant="outline">{report.item.report_type}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-1">Reason: {report.reason}</p>
              {report.details && (
                <p className="text-sm text-muted-foreground">{report.details}</p>
              )}
            </div>

            <div className="text-sm text-muted-foreground">
              <p>
                Item posted by <span className="font-medium">{report.item.reporter.full_name}</span> (
                {report.item.reporter.email})
              </p>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Admin Note (optional)</label>
              <Textarea
                placeholder="Add a note about your decision..."
                value={adminNotes[report.id] || ''}
                onChange={(e) =>
                  setAdminNotes((prev) => ({ ...prev, [report.id]: e.target.value }))
                }
                className="min-h-[80px]"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleRemoveItem(report.id, report.item_id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove Item
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() =>
                  handleBanUser(report.id, report.item.reporter_id, report.item.reporter.full_name)
                }
              >
                <Ban className="h-4 w-4 mr-2" />
                Ban User
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleDismiss(report.id)}>
                Dismiss Report
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
