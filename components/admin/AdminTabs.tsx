'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReportsTab } from './ReportsTab';
import { ItemsTab } from './ItemsTab';
import { UsersTab } from './UsersTab';
import { LocationsTab } from './LocationsTab';
import { AuditLogTab } from './AuditLogTab';

type AdminTabsProps = {
  activeTab?: 'reports' | 'items' | 'users' | 'locations' | 'audit';
};

export function AdminTabs({ activeTab = 'reports' }: AdminTabsProps) {

  return (
    <Tabs value={activeTab} className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="reports">Reports</TabsTrigger>
        <TabsTrigger value="items">All Items</TabsTrigger>
        <TabsTrigger value="users">Users</TabsTrigger>
        <TabsTrigger value="locations">Locations</TabsTrigger>
        <TabsTrigger value="audit">Audit Log</TabsTrigger>
      </TabsList>

      <TabsContent value="reports" className="mt-6">
        <ReportsTab />
      </TabsContent>

      <TabsContent value="items" className="mt-6">
        <ItemsTab />
      </TabsContent>

      <TabsContent value="users" className="mt-6">
        <UsersTab />
      </TabsContent>

      <TabsContent value="locations" className="mt-6">
        <LocationsTab />
      </TabsContent>

      <TabsContent value="audit" className="mt-6">
        <AuditLogTab />
      </TabsContent>
    </Tabs>
  );
}
