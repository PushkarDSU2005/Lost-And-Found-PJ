import type { Metadata } from 'next';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Package } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Drop-off Points',
  description: 'Find campus drop-off locations for lost and found items',
};

type Location = {
  id: string;
  name: string;
  building: string;
  floor: string | null;
  description: string | null;
  drop_point: boolean;
  hours: string | null;
};

export default async function DropPointsPage() {
  const supabase = await createSupabaseServerClient();

  const { data: locations } = await supabase
    .from('locations')
    .select('*')
    .eq('drop_point', true)
    .order('name', { ascending: true });

  const dropPoints = (locations || []) as Location[];

  return (
    <div className="container mx-auto px-4 py-8 pb-28 md:pb-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Drop-off Points</h1>
          <p className="text-muted-foreground">
            Staffed locations where you can drop off found items or pick up your lost belongings
          </p>
        </div>

        {/* What to Bring Section */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              <CardTitle>What to Bring</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">When Dropping Off a Found Item:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>The item itself</li>
                <li>Your student/staff ID</li>
                <li>Details about where and when you found it</li>
                <li>Staff will log the item and give you a receipt</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium mb-2">When Picking Up a Lost Item:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Your student/staff ID</li>
                <li>Photo ID (driver's license, passport)</li>
                <li>Proof of ownership (serial number, photos, receipt)</li>
                <li>The item must match your claim description</li>
              </ul>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm">
                <span className="font-medium">Note:</span> For high-value or sensitive items (laptops,
                wallets, IDs), additional verification may be required before release.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Drop-off Locations */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Campus Locations</h2>

          {dropPoints.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No drop-off points are currently available. Check back soon.
              </CardContent>
            </Card>
          ) : (
            dropPoints.map((location) => (
              <Card key={location.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 mt-1 text-muted-foreground" />
                      <div>
                        <CardTitle className="text-xl">{location.name}</CardTitle>
                        <CardDescription>
                          {location.building}
                          {location.floor && ` • Floor ${location.floor}`}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge>Drop Point</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {location.description && (
                    <p className="text-sm text-muted-foreground">{location.description}</p>
                  )}

                  {location.hours && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>
                        <span className="font-medium">Hours:</span> {location.hours}
                      </span>
                    </div>
                  )}

                  <div className="p-3 bg-muted/50 rounded text-sm">
                    <p className="font-medium mb-1">Services available:</p>
                    <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                      <li>Log and store found items</li>
                      <li>Verify and release claimed items</li>
                      <li>Answer questions about lost & found</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Tips Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Tips for a Smooth Experience</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>Visit during posted hours to avoid closed offices</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>Bring ID even if you're just inquiring about an item</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>
                  If you found a wallet or ID, report it online first so the owner can be notified
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>
                  Items are typically held for 30-90 days before being donated or recycled
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
