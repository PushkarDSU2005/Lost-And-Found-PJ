'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { removeItem } from '@/app/actions/admin';
import { Trash2, Search } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

type Item = {
  id: string;
  title: string;
  report_type: 'lost' | 'found';
  status: string;
  category: string;
  created_at: string;
  reporter: {
    id: string;
    full_name: string;
    email: string;
  };
};

export function ItemsTab() {
  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredItems(items);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredItems(
        items.filter(
          (item) =>
            item.title.toLowerCase().includes(query) ||
            item.reporter.full_name.toLowerCase().includes(query) ||
            item.reporter.email.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, items]);

  async function loadItems() {
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase
        .from('items')
        .select(`
          id,
          title,
          report_type,
          status,
          category,
          created_at,
          reporter:profiles!items_reporter_id_fkey (
            id,
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setItems(data as unknown as Item[]);
      setFilteredItems(data as unknown as Item[]);
    } catch (err) {
      console.error('Failed to load items:', err);
      toast.error('Failed to load items');
    } finally {
      setLoading(false);
    }
  }

  function toggleItemSelection(itemId: string) {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }

  function toggleAllSelection() {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredItems.map((item) => item.id)));
    }
  }

  async function handleBulkRemove() {
    if (selectedItems.size === 0) {
      toast.error('No items selected');
      return;
    }

    if (!confirm(`Remove ${selectedItems.size} selected item(s)? Posters will be notified.`)) return;

    try {
      const results = await Promise.all(
        Array.from(selectedItems).map((itemId) =>
          removeItem({ item_id: itemId, reason: 'Bulk removal by admin' })
        )
      );

      const errors = results.filter((r) => !r.success);
      if (errors.length > 0) {
        toast.error(`Failed to remove ${errors.length} item(s)`);
      } else {
        toast.success(`Removed ${selectedItems.size} item(s) successfully`);
      }

      setSelectedItems(new Set());
      loadItems();
    } catch (err) {
      console.error('Failed to remove items:', err);
      toast.error('Failed to remove items');
    }
  }

  async function handleSingleRemove(itemId: string, title: string) {
    if (!confirm(`Remove "${title}"? The poster will be notified.`)) return;

    try {
      const result = await removeItem({ item_id: itemId, reason: 'Removed by admin' });
      if (!result.success) throw new Error(result.error);

      toast.success('Item removed successfully');
      loadItems();
    } catch (err) {
      console.error('Failed to remove item:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to remove item');
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading items...</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>All Items</CardTitle>
          <CardDescription>Manage all lost and found items in the system</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, poster name, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              variant="destructive"
              disabled={selectedItems.size === 0}
              onClick={handleBulkRemove}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remove Selected ({selectedItems.size})
            </Button>
          </div>

          {filteredItems.length > 0 && (
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedItems.size === filteredItems.length && filteredItems.length > 0}
                onCheckedChange={toggleAllSelection}
              />
              <span className="text-sm text-muted-foreground">Select all ({filteredItems.length})</span>
            </div>
          )}
        </CardContent>
      </Card>

      {filteredItems.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No items found
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredItems.map((item) => (
            <Card key={item.id}>
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedItems.has(item.id)}
                    onCheckedChange={() => toggleItemSelection(item.id)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/items/${item.id}`}
                          className="font-medium hover:underline block truncate"
                        >
                          {item.title}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          Posted by {item.reporter.full_name} ({item.reporter.email}) •{' '}
                          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant="outline">{item.report_type}</Badge>
                        <Badge variant={item.status === 'open' ? 'default' : 'secondary'}>
                          {item.status}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSingleRemove(item.id, item.title)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
