import { useEffect, useState } from 'react';
import { Eye, MapPinned, Pencil, Plus, Power } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import ErrorState from '@/components/ui/error-state';
import { DataTable, type DataColumn } from '@/components/operations/DataTable';
import { DataTableControls } from '@/components/operations/DataTableControls';
import { DataTablePagination } from '@/components/operations/DataTablePagination';
import OperationsStatusBadge from '@/components/operations/OperationsStatusBadge';
import { apiError, idOf, type ApiItem } from '@/services/operationsDashboardService';
import { createAdminCampground, getAdminCampground, listAdminCampgrounds, updateAdminCampground } from '@/services/adminManagementService';

type CampgroundForm = {
  id?: string;
  name: string;
  description: string;
  shortDescription: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  longitude: string;
  latitude: string;
  categories: string;
  amenities: string;
  totalSites: string;
  petPolicy: string;
  isActive: boolean;
  isFeatured: boolean;
};

const blankForm = (): CampgroundForm => ({
  name: '',
  description: '',
  shortDescription: '',
  street: '',
  city: '',
  state: '',
  zip: '',
  country: 'US',
  phone: '',
  email: '',
  website: '',
  longitude: '',
  latitude: '',
  categories: 'tent',
  amenities: '',
  totalSites: '0',
  petPolicy: 'restricted',
  isActive: true,
  isFeatured: false,
});

const toForm = (item: ApiItem): CampgroundForm => ({
  id: idOf(item),
  name: item.name ?? '',
  description: item.description ?? '',
  shortDescription: item.shortDescription ?? '',
  street: item.address?.street ?? '',
  city: item.address?.city ?? '',
  state: item.address?.state ?? '',
  zip: item.address?.zip ?? '',
  country: item.address?.country ?? 'US',
  phone: item.phone ?? '',
  email: item.email ?? '',
  website: item.website ?? '',
  longitude: String(item.location?.coordinates?.[0] ?? ''),
  latitude: String(item.location?.coordinates?.[1] ?? ''),
  categories: (item.categories ?? []).join(', '),
  amenities: (item.amenities ?? []).join(', '),
  totalSites: String(item.totalSites ?? 0),
  petPolicy: item.petPolicy ?? 'restricted',
  isActive: item.isActive !== false,
  isFeatured: Boolean(item.isFeatured),
});

const csv = (value: string) => value.split(',').map((item) => item.trim()).filter(Boolean);

export default function DashboardAdminCampgrounds() {
  const [data, setData] = useState<{ rows: ApiItem[]; page: number; totalPages: number }>({ rows: [], page: 1, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('name');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<CampgroundForm | null>(null);
  const [details, setDetails] = useState<ApiItem | null>(null);
  const [saving, setSaving] = useState(false);

  const load = (page = data.page) => {
    setLoading(true);
    listAdminCampgrounds({
      page,
      limit: 20,
      search: search || undefined,
      isActive: filter === 'all' ? undefined : filter === 'active',
      sort,
      order,
    })
      .then((result) => setData({ rows: result.data, page: result.meta.page, totalPages: result.meta.totalPages }))
      .catch((caught) => setError(apiError(caught, 'We could not load campgrounds.')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timer = window.setTimeout(() => load(1), 180);
    return () => window.clearTimeout(timer);
  }, [search, filter, sort, order]);

  const openDetails = async (item: ApiItem) => {
    try {
      setDetails(await getAdminCampground(idOf(item)));
    } catch (caught) {
      setError(apiError(caught, 'We could not load campground details.'));
    }
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form) return;
    const categories = csv(form.categories);
    const longitude = Number(form.longitude);
    const latitude = Number(form.latitude);
    if (
      form.description.trim().length < 10 ||
      !form.name.trim() ||
      !form.street.trim() ||
      !form.city.trim() ||
      !form.state.trim() ||
      !form.zip.trim() ||
      !form.phone.trim() ||
      !form.email.trim() ||
      !categories.length ||
      !Number.isFinite(longitude) ||
      !Number.isFinite(latitude) ||
      Number(form.totalSites) < 0
    ) {
      setError('Complete all required fields, including a description, category, valid coordinates, and site total.');
      return;
    }
    const input = {
      name: form.name.trim(),
      description: form.description.trim(),
      shortDescription: form.shortDescription.trim() || undefined,
      location: { type: 'Point', coordinates: [longitude, latitude] },
      address: { street: form.street.trim(), city: form.city.trim(), state: form.state.trim(), zip: form.zip.trim(), country: form.country.trim() || 'US' },
      phone: form.phone.trim(),
      email: form.email.trim(),
      website: form.website.trim() || undefined,
      categories,
      amenities: csv(form.amenities),
      totalSites: Number(form.totalSites),
      petPolicy: form.petPolicy,
      isActive: form.isActive,
      isFeatured: form.isFeatured,
    };
    setSaving(true);
    try {
      if (form.id) await updateAdminCampground(form.id, input);
      else await createAdminCampground(input);
      toast.success(form.id ? 'Campground updated' : 'Campground created');
      setForm(null);
      load();
    } catch (caught) {
      setError(apiError(caught, 'We could not save this campground.'));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (item: ApiItem) => {
    try {
      await updateAdminCampground(idOf(item), { isActive: item.isActive === false });
      toast.success(item.isActive === false ? 'Campground reactivated' : 'Campground deactivated');
      load();
    } catch (caught) {
      setError(apiError(caught, 'We could not update campground status.'));
    }
  };

  const columns: DataColumn<ApiItem>[] = [
    {
      label: 'Campground',
      sortKey: 'name',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-secondary text-primary">
            <MapPinned className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="font-medium leading-tight">{row.name}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {row.address?.city}, {row.address?.state}
            </p>
          </div>
        </div>
      ),
    },
    { label: 'Sites', sortKey: 'totalSites', cell: (row) => <span className="font-mono text-sm">{row.totalSites ?? 0}</span> },
    {
      label: 'Categories',
      cell: (row) => <span className="capitalize text-muted-foreground">{(row.categories ?? []).join(', ') || '—'}</span>,
    },
    {
      label: 'Status',
      cell: (row) =>
        row.isActive === false ? (
          <OperationsStatusBadge status="cancelled" />
        ) : row.isFeatured ? (
          <OperationsStatusBadge status="confirmed" />
        ) : (
          <OperationsStatusBadge status="completed" />
        ),
    },
    {
      label: '',
      className: 'text-right',
      cell: (row) => (
        <div className="flex justify-end gap-1">
          <Button size="icon" variant="ghost" title="View details" onClick={() => void openDetails(row)}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" title="Edit" onClick={() => setForm(toForm(row))}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            title={row.isActive === false ? 'Reactivate' : 'Deactivate'}
            onClick={() => void toggleActive(row)}
          >
            <Power className={row.isActive === false ? 'h-4 w-4' : 'h-4 w-4 text-muted-foreground'} />
          </Button>
        </div>
      ),
    },
  ];

  const activeCount = data.rows.filter((row) => row.isActive !== false).length;
  const featuredCount = data.rows.filter((row) => Boolean(row.isFeatured)).length;
  const totalSites = data.rows.reduce((sum, row) => sum + Number(row.totalSites ?? 0), 0);

  return (
    <div className="space-y-8">
      <section className="flex flex-wrap items-end justify-between gap-6 border-b border-border/60 pb-8">
        <div className="max-w-2xl">
          <p className="eyebrow">Administrator</p>
          <h1 className="mt-3 display-2">Campground management</h1>
          <p className="lede mt-4">Curate the four CampFlow locations—identity, location, capacity, and discoverability—from one editorial control panel.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => load(1)} disabled={loading}>
            Refresh
          </Button>
          <Button onClick={() => setForm(blankForm())}>
            <Plus />Add campground
          </Button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <KpiTile label="Locations" value={String(data.rows.length)} detail="Across portfolio" />
        <KpiTile label="Active" value={String(activeCount)} detail="Available for booking" />
        <KpiTile label="Featured" value={String(featuredCount)} detail={`${totalSites.toLocaleString()} total sites`} />
      </section>

      {error && <ErrorState title="Campgrounds unavailable" message={error} />}

      <Card className="overflow-hidden border-border/60 shadow-soft">
        <div className="border-b border-border/60 px-5 py-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="eyebrow">Portfolio</p>
              <h2 className="mt-1 display-3">All locations</h2>
            </div>
          </div>
        </div>
        <DataTableControls
          search={search}
          onSearch={setSearch}
          filter={filter}
          onFilter={setFilter}
          filterOptions={[
            { value: 'all', label: 'All locations' },
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
          ]}
          placeholder="Search campgrounds…"
        />
        {loading ? (
          <div className="grid min-h-64 place-items-center">
            <Spinner className="size-6 text-primary" />
          </div>
        ) : data.rows.length ? (
          <>
            <DataTable
              columns={columns}
              rows={data.rows}
              rowKey={idOf}
              onSort={(key) => {
                setOrder(key === sort && order === 'asc' ? 'desc' : 'asc');
                setSort(key);
              }}
            />
            <DataTablePagination page={data.page} totalPages={data.totalPages} onPageChange={load} />
          </>
        ) : (
          <CardContent className="p-12 text-center text-sm text-muted-foreground">No campgrounds match these controls.</CardContent>
        )}
      </Card>

      <CampgroundDialog form={form} setForm={setForm} saving={saving} onSave={save} />

      <Dialog open={!!details} onOpenChange={(open) => !open && setDetails(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl tracking-tight">{details?.name}</DialogTitle>
          </DialogHeader>
          {details && (
            <div className="space-y-6 text-sm">
              <div className="rounded-md bg-card p-5 ring-1 ring-border/60">
                <p className="text-base font-medium leading-snug">{details.shortDescription || details.description}</p>
                <p className="mt-2 text-muted-foreground">
                  {[details.address?.street, details.address?.city, details.address?.state, details.address?.zip].filter(Boolean).join(', ')}
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Detail label="Phone" value={details.phone || '—'} />
                <Detail label="Email" value={details.email || '—'} />
                <Detail label="Website" value={details.website || '—'} />
                <Detail label="Pet policy" value={details.petPolicy || '—'} />
                <Detail label="Total sites" value={String(details.totalSites ?? 0)} />
                <Detail label="Categories" value={(details.categories ?? []).join(', ') || '—'} />
                <Detail label="Amenities" value={(details.amenities ?? []).join(', ') || '—'} />
                <Detail
                  label="Coordinates"
                  value={`${details.location?.coordinates?.[0] ?? '—'}, ${details.location?.coordinates?.[1] ?? '—'}`}
                />
              </div>
              <div>
                <p className="eyebrow">Description</p>
                <p className="mt-2 leading-relaxed text-muted-foreground">{details.description}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function KpiTile({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <Card className="border-border/60 shadow-soft">
      <CardContent className="p-5">
        <p className="eyebrow">{label}</p>
        <p className="mt-3 font-serif text-3xl tracking-tight">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="eyebrow">{label}</p>
      <p className="mt-1.5 break-words text-sm">{value}</p>
    </div>
  );
}

function CampgroundDialog({
  form,
  setForm,
  saving,
  onSave,
}: {
  form: CampgroundForm | null;
  setForm: (form: CampgroundForm | null) => void;
  saving: boolean;
  onSave: (event: React.FormEvent) => void;
}) {
  const update = (field: keyof CampgroundForm, value: string | boolean) => form && setForm({ ...form, [field]: value });
  return (
    <Dialog open={!!form} onOpenChange={(open) => !open && setForm(null)}>
      <DialogContent className="max-h-[88vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl tracking-tight">
            {form?.id ? 'Edit campground' : 'Add campground'}
          </DialogTitle>
        </DialogHeader>
        {form && (
          <form className="space-y-6" onSubmit={onSave}>
            <section>
              <p className="eyebrow">Identity</p>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <Field label="Name" value={form.name} onChange={(value) => update('name', value)} required />
                <Field label="Email" type="email" value={form.email} onChange={(value) => update('email', value)} required />
                <Field label="Phone" value={form.phone} onChange={(value) => update('phone', value)} required />
                <Field label="Website" type="url" value={form.website} onChange={(value) => update('website', value)} />
              </div>
            </section>

            <section>
              <p className="eyebrow">Location</p>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <Field label="Street" value={form.street} onChange={(value) => update('street', value)} required />
                <Field label="City" value={form.city} onChange={(value) => update('city', value)} required />
                <Field label="State" value={form.state} onChange={(value) => update('state', value)} required />
                <Field label="Postal code" value={form.zip} onChange={(value) => update('zip', value)} required />
                <Field label="Country" value={form.country} onChange={(value) => update('country', value)} required />
                <Field label="Total sites" type="number" min="0" value={form.totalSites} onChange={(value) => update('totalSites', value)} required />
                <Field label="Longitude" type="number" step="any" value={form.longitude} onChange={(value) => update('longitude', value)} required />
                <Field label="Latitude" type="number" step="any" value={form.latitude} onChange={(value) => update('latitude', value)} required />
              </div>
            </section>

            <section>
              <p className="eyebrow">Programming</p>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <Field label="Categories (comma-separated)" value={form.categories} onChange={(value) => update('categories', value)} required />
                <Field label="Amenities (comma-separated)" value={form.amenities} onChange={(value) => update('amenities', value)} />
                <Field label="Pet policy" value={form.petPolicy} onChange={(value) => update('petPolicy', value)} />
              </div>
            </section>

            <section>
              <p className="eyebrow">Narrative</p>
              <div className="mt-3 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="camp-short">Short description</Label>
                  <Textarea
                    id="camp-short"
                    value={form.shortDescription}
                    onChange={(event) => update('shortDescription', event.target.value)}
                    rows={2}
                    placeholder="A one-line editorial summary."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="camp-description">Description</Label>
                  <Textarea
                    id="camp-description"
                    value={form.description}
                    onChange={(event) => update('description', event.target.value)}
                    rows={5}
                    placeholder="Describe the property, terrain, and guest experience."
                  />
                </div>
              </div>
            </section>

            <section>
              <p className="eyebrow">Visibility</p>
              <div className="mt-3 space-y-3">
                <Toggle
                  label="Active"
                  description="Inactive campgrounds are hidden from public discovery."
                  checked={form.isActive}
                  onChange={(value) => update('isActive', value)}
                />
                <Toggle
                  label="Featured"
                  description="Featured locations appear in highlighted placements."
                  checked={form.isFeatured}
                  onChange={(value) => update('isFeatured', value)}
                />
              </div>
            </section>

            <div className="flex items-center justify-end gap-2 border-t border-border/60 pt-4">
              <Button type="button" variant="ghost" onClick={() => setForm(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : form.id ? 'Save changes' : 'Create campground'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  value,
  onChange,
  ...props
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
} & Omit<React.ComponentProps<typeof Input>, 'value' | 'onChange'>) {
  const id = `field-${label.replace(/\W/g, '-')}`;
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} onChange={(event) => onChange(event.target.value)} {...props} />
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border/60 bg-card px-4 py-3">
      <div className="pr-4">
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}