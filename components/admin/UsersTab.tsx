'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { banUser, unbanUser } from '@/app/actions/admin';
import { Ban, UserCheck, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type User = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  banned: boolean;
  ban_reason: string | null;
  created_at: string;
  _count: {
    items: number;
    claims: number;
  };
};

export function UsersTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredUsers(
        users.filter(
          (user) =>
            user.full_name.toLowerCase().includes(query) ||
            user.email.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, users]);

  async function loadUsers() {
    try {
      const supabase = createSupabaseBrowserClient();
      
      // Get all users
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, banned, ban_reason, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Get counts for each user
      const usersWithCounts = await Promise.all(
        profilesData.map(async (profile: any) => {
          const [itemsResult, claimsResult] = await Promise.all([
            supabase.from('items').select('id', { count: 'exact', head: true }).eq('reporter_id', profile.id),
            supabase.from('claims').select('id', { count: 'exact', head: true }).eq('claimant_id', profile.id),
          ]);

          return {
            ...profile,
            _count: {
              items: itemsResult.count || 0,
              claims: claimsResult.count || 0,
            },
          };
        })
      );

      setUsers(usersWithCounts);
      setFilteredUsers(usersWithCounts);
    } catch (err) {
      console.error('Failed to load users:', err);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  async function handleBanUser(userId: string, userName: string) {
    const reason = prompt(`Enter reason for banning ${userName}:`);
    if (!reason) return;

    try {
      const result = await banUser({ user_id: userId, reason });
      if (!result.success) throw new Error(result.error);

      toast.success(`User ${userName} banned successfully`);
      loadUsers();
    } catch (err) {
      console.error('Failed to ban user:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to ban user');
    }
  }

  async function handleUnbanUser(userId: string, userName: string) {
    if (!confirm(`Unban ${userName}?`)) return;

    try {
      const result = await unbanUser({ user_id: userId });
      if (!result.success) throw new Error(result.error);

      toast.success(`User ${userName} unbanned successfully`);
      loadUsers();
    } catch (err) {
      console.error('Failed to unban user:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to unban user');
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading users...</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>View and manage all users in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {filteredUsers.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No users found
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredUsers.map((user) => (
            <Card key={user.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{user.full_name}</p>
                      <Badge variant="outline" className="capitalize">
                        {user.role}
                      </Badge>
                      {user.banned && (
                        <Badge variant="destructive">Banned</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{user.email}</p>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>{user._count.items} posts</span>
                      <span>{user._count.claims} claims</span>
                      <span>
                        Joined {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    {user.banned && user.ban_reason && (
                      <p className="text-sm text-destructive mt-2">
                        Ban reason: {user.ban_reason}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    {user.role !== 'admin' && (
                      <>
                        {user.banned ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUnbanUser(user.id, user.full_name)}
                          >
                            <UserCheck className="h-4 w-4 mr-2" />
                            Unban
                          </Button>
                        ) : (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleBanUser(user.id, user.full_name)}
                          >
                            <Ban className="h-4 w-4 mr-2" />
                            Ban User
                          </Button>
                        )}
                      </>
                    )}
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
