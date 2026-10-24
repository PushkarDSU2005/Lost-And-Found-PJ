'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { createLocation, updateLocation, deleteLocation } from '@/app/actions/admin';
import { Plus, Edit, Trash2, MapPin } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type Location = {
  id: string;
  name: string;
  building: string;
  floor: string | null;
  description: string | null;
  drop_point: boolean;
  hours: string | null;
};

type LocationFormData = {
  name: string;
  building: string;
  floor: string;
  description: string;
  drop_point: boolean;
  hours: string;
};

const emptyForm: LocationFormData = {
  name: '',
  building: '',
  floor: '',
  description: '',
  drop_point: false,
  hours: '',
};

export function LocationsTab() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [formData, setFormData] = useState<LocationFormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadLocations();
  }, []);

  async function loadLocations() {
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setLocations(data);
    } catch (err) {
      console.error('Failed to load locations:', err);
      toast.error('Failed to load locations');
    } finally {
      setLoading(false);
    }
  }

  function openCreateDialog() {
    setEditingLocation(null);
    setFormData(emptyForm);
    setDialogOpen(true);
  }

  function openEditDialog(location: Location) {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      building: location.building,
      floor: location.floor || '',
      description: location.description || '',
      drop_point: location.drop_point,
      hours: location.hours || '',
    });
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingLocation) {
        const result = await updateLocation({
          location_id: editingLocation.id,
          name: formData.name,
          building: formData.building,
          floor: formData.floor || undefined,
          drop_point: formData.drop_point,
          hours: formData.hours || undefined,
        });
        if (!result.success) throw new Error(result.error);
        toast.success('Location updated successfully');
      } else {
        const result = await createLocation({
          name: formData.name,
          building: formData.building,
          floor: formData.floor || undefined,
          drop_point: formData.drop_point,
          hours: formData.hours || undefined,
        });
        if (!result.success) throw new Error(result.error);
        toast.success('Location created successfully');
      }

      setDialogOpen(false);
      loadLocations();
    } catch (err) {
      console.error('Failed to save location:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to save location');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(location: Location) {
    if (!confirm(`Delete location "${location.name}"? This cannot be undone.`)) return;

    try {
      const result = await deleteLocation({ location_id: location.id });
      if (!result.success) throw new Error(result.error);

      toast.success('Location deleted successfully');
      loadLocations();
    } catch (err) {
      console.error('Failed to delete location:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to delete location');
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading locations...</div>;
  }

  return (
    <>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Drop-off Locations</CardTitle>
                <CardDescription>Manage campus buildings and drop-off points</CardDescription>
              </div>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add Location
              </Button>
            </div>
          </CardHeader>
        </Card>

        {locations.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No locations configured yet
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {locations.map((location) => (
              <Card key={location.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-5 w-5 mt-0.5 text-muted-foreground" />
                      <div>
                        <CardTitle className="text-lg">{location.name}</CardTitle>
                        <CardDescription>
                          {location.building}
                          {location.floor && ` • Floor ${location.floor}`}
                        </CardDescription>
                      </div>
                    </div>
                    {location.drop_point && <Badge>Drop Point</Badge>}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {location.description && (
                    <p className="text-sm text-muted-foreground">{location.description}</p>
                  )}
                  {location.drop_point && location.hours && (
                    <p className="text-sm">
                      <span className="font-medium">Hours:</span> {location.hours}
                    </p>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(location)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(location)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingLocation ? 'Edit Location' : 'Add New Location'}
              </DialogTitle>
              <DialogDescription>
                {editingLocation
                  ? 'Update the location details below'
                  : 'Add a new campus building or drop-off point'}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Location Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Student Union"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="building">Building *</Label>
                  <Input
                    id="building"
                    value={formData.building}
                    onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                    placeholder="e.g., Main Building"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="floor">Floor</Label>
                  <Input
                    id="floor"
                    value={formData.floor}
                    onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                    placeholder="e.g., 2"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Additional details about this location..."
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="drop_point"
                  checked={formData.drop_point}
                  onCheckedChange={(checked) => setFormData({ ...formData, drop_point: checked })}
                />
                <Label htmlFor="drop_point">This is a staffed drop-off point</Label>
              </div>

              {formData.drop_point && (
                <div className="grid gap-2">
                  <Label htmlFor="hours">Opening Hours</Label>
                  <Input
                    id="hours"
                    value={formData.hours}
                    onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                    placeholder="e.g., Mon-Fri 9am-5pm"
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : editingLocation ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
