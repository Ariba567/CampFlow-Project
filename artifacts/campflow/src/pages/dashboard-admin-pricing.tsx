import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import ErrorState from '@/components/ui/error-state';
import { DataTable, type DataColumn } from '@/components/operations/DataTable';
import { DataTableControls } from '@/components/operations/DataTableControls';
import { DataTablePagination } from '@/components/operations/DataTablePagination';
import OperationsStatusBadge from '@/components/operations/OperationsStatusBadge';
import { apiError, idOf, labelOf, type ApiItem } from '@/services/operationsDashboardService';
import { createPricingRule, deletePricingRule, listAdminCampgrounds, listPricingRules, updatePricingRule } from '@/services/adminManagementService';

type PricingForm = { id?: string; name: string; campground: string; type: string; applyMode: string; multiplier: string; flatRate: string; startDate: string; endDate: string; daysOfWeek: number[]; couponCode: string; maxUses: string; priority: string; isActive: boolean; description: string };
const blankForm = (): PricingForm => ({ name: '', campground: '', type: 'seasonal', applyMode: 'multiplier', multiplier: '1.1', flatRate: '', startDate: '', endDate: '', daysOfWeek: [5, 6], couponCode: '', maxUses: '', priority: '0', isActive: true, description: '' });
const toDateInput = (value: unknown) => String(value ?? '').slice(0, 10);
const toForm = (item: ApiItem): PricingForm => ({ id: idOf(item), name: item.name ?? '', campground: idOf(item.campground), type: item.type ?? 'seasonal', applyMode: item.applyMode ?? 'multiplier', multiplier: item.multiplier != null ? String(item.multiplier) : '', flatRate: item.flatRate != null ? String(item.flatRate) : '', startDate: toDateInput(item.startDate), endDate: toDateInput(item.endDate), daysOfWeek: item.daysOfWeek ?? [5, 6], couponCode: item.couponCode ?? '', maxUses: item.maxUses != null ? String(item.maxUses) : '', priority: String(item.priority ?? 0), isActive: item.isActive !== false, description: item.description ?? '' });

const TYPE_LABEL: Record<string, string> = {
  seasonal: 'Seasonal',
  weekend: 'Weekend',
  holiday: 'Holiday',
  promotional: 'Promotional',
};

export default function DashboardAdminPricing() {
  const [data, setData] = useState<{ rows: ApiItem[]; page: number; totalPages: number }>({ rows: [], page: 1, totalPages: 1 });
  const [campgrounds, setCampgrounds] = useState<ApiItem[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('startDate');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<PricingForm | null>(null);
  const [saving, setSaving] = useState(false);

  const load = (page = data.page) => {
    setLoading(true);
    listPricingRules({ page, limit: 20, search: search || undefined, type: filter === 'all' ? undefined : filter, sort, order })
      .then((result) => setData({ rows: result.data, page: result.meta.page, totalPages: result.meta.totalPages }))
      .catch((caught) => setError(apiError(caught, 'We could not load pricing rules.')))
      .finally(() => setLoading(false));
  };
  useEffect(() => { listAdminCampgrounds({ page: 1, limit: 100, isActive: true }).then((result) => setCampgrounds(result.data)).catch(() => undefined); }, []);
  useEffect(() => { const timer = window.setTimeout(() => load(1), 180); return () => window.clearTimeout(timer); }, [search, filter, sort, order]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form) return;
    const requiresRate = form.applyMode !== 'multiplier';
    const validRate = requiresRate ? Number(form.flatRate) >= 0 && form.flatRate !== '' : Number(form.multiplier) > 0;
    if (!form.name.trim() || !form.campground || !form.startDate || !form.endDate || new Date(form.endDate) <= new Date(form.startDate) || !validRate || (form.type === 'promotional' && !form.couponCode.trim())) {
      setError('Provide a campground, valid date range, adjustment, and a promo code for promotions.');
      return;
    }
    const input = {
      name: form.name.trim(),
      campground: form.campground,
      type: form.type,
      applyMode: form.applyMode,
      multiplier: form.applyMode === 'multiplier' ? Number(form.multiplier) : undefined,
      flatRate: requiresRate ? Number(form.flatRate) : undefined,
      startDate: form.startDate,
      endDate: form.endDate,
      daysOfWeek: form.type === 'weekend' ? form.daysOfWeek : undefined,
      couponCode: form.type === 'promotional' ? form.couponCode.trim().toUpperCase() : undefined,
      maxUses: form.type === 'promotional' && form.maxUses ? Number(form.maxUses) : undefined,
      priority: Number(form.priority) || 0,
      isActive: form.isActive,
      description: form.description.trim() || undefined,
    };
    setSaving(true);
    try {
      if (form.id) await updatePricingRule(form.id, input);
      else await createPricingRule(input);
      toast.success(form.id ? 'Pricing rule updated' : 'Pricing rule created');
      setForm(null);
      load();
    } catch (caught) {
      setError(apiError(caught, 'We could not save this pricing rule.'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item: ApiItem) => {
    if (!window.confirm(`Delete ${item.name}? This cannot be undone.`)) return;
    try {
      await deletePricingRule(idOf(item));
      toast.success('Pricing rule deleted');
      load();
    } catch (caught) {
      setError(apiError(caught, 'We could not delete this pricing rule.'));
    }
  };

  const columns: DataColumn<ApiItem>[] = [
    {
      label: 'Rule',
      sortKey: 'name',
      cell: (row) => (
        <div>
          <p className="font-medium">{row.name}</p>
          <p className="text-xs text-muted-foreground">{TYPE_LABEL[row.type] ?? row.type} · {row.applyMode?.replace('_', ' ')}</p>
        </div>
      ),
    },
    { label: 'Campground', cell: (row) => labelOf(row.campground) },
    {
      label: 'Dates',
      sortKey: 'startDate',
      cell: (row) => (
        <span>
          {toDateInput(row.startDate)}
          <br />
          <span className="text-xs text-muted-foreground">to {toDateInput(row.endDate)}</span>
        </span>
      ),
    },
    { label: 'Adjustment', cell: (row) => (row.applyMode === 'multiplier' ? `${row.multiplier}×` : `$${Number(row.flatRate ?? 0).toFixed(2)}`) },
    { label: 'Status', cell: (row) => <span className={row.isActive === false ? 'text-muted-foreground' : 'font-medium text-primary'}>{row.isActive === false ? 'Inactive' : 'Active'}</span> },
    {
      label: 'Actions',
      className: 'text-right',
      cell: (row) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" onClick={() => setForm(toForm(row))}><Pencil className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => void remove(row)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <section className="flex flex-wrap items-end justify-between gap-4 border-b border-border/70 pb-6">
        <div>
          <p className="eyebrow">Administrator</p>
          <h1 className="display-2 mt-3">Pricing management</h1>
          <p className="lede mt-3 max-w-2xl">
            Set seasons, weekend and holiday rates, and promotional campaigns that flow directly into guest quotes.
          </p>
        </div>
        <Button onClick={() => setForm(blankForm())} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus /> Create pricing rule
        </Button>
      </section>

      {error && <ErrorState title="Pricing unavailable" message={error} />}

      <Card className="overflow-hidden border-border/60">
        <DataTableControls
          search={search}
          onSearch={setSearch}
          filter={filter}
          onFilter={setFilter}
          filterOptions={[
            { value: 'all', label: 'All rule types' },
            { value: 'seasonal', label: 'Seasonal' },
            { value: 'weekend', label: 'Weekend' },
            { value: 'holiday', label: 'Holiday' },
            { value: 'promotional', label: 'Promotional' },
          ]}
          placeholder="Search pricing rules…"
        />
        {loading ? (
          <div className="grid min-h-64 place-items-center"><Spinner className="size-6 text-primary" /></div>
        ) : data.rows.length ? (
          <>
            <DataTable
              columns={columns}
              rows={data.rows}
              rowKey={idOf}
              onSort={(key) => { setOrder(key === sort && order === 'asc' ? 'desc' : 'asc'); setSort(key); }}
            />
            <DataTablePagination page={data.page} totalPages={data.totalPages} onPageChange={load} />
          </>
        ) : (
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            No pricing rules match these controls.
          </CardContent>
        )}
      </Card>

      <PricingDialog form={form} setForm={setForm} campgrounds={campgrounds} saving={saving} onSave={save} />
    </div>
  );
}

function PricingDialog({
  form,
  setForm,
  campgrounds,
  saving,
  onSave,
}: {
  form: PricingForm | null;
  setForm: (form: PricingForm | null) => void;
  campgrounds: ApiItem[];
  saving: boolean;
  onSave: (event: React.FormEvent) => void;
}) {
  const update = (field: keyof PricingForm, value: string | boolean | number[]) => form && setForm({ ...form, [field]: value });
  const weekend = form?.type === 'weekend';
  const promo = form?.type === 'promotional';
  return (
    <Dialog open={!!form} onOpenChange={(open) => !open && setForm(null)}>
      <DialogContent className="max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{form?.id ? 'Edit pricing rule' : 'Create pricing rule'}</DialogTitle>
        </DialogHeader>
        {form && (
          <form className="space-y-4" onSubmit={onSave}>
            <div className="grid gap-4 sm:grid-cols-2">
              <PriceField label="Rule name" value={form.name} onChange={(value) => update('name', value)} required />
              <div className="space-y-2">
                <Label>Campground</Label>
                <Select value={form.campground} onValueChange={(value) => update('campground', value)}>
                  <SelectTrigger><SelectValue placeholder="Select a campground" /></SelectTrigger>
                  <SelectContent>
                    {campgrounds.map((item) => <SelectItem key={idOf(item)} value={idOf(item)}>{item.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Rule type</Label>
                <Select value={form.type} onValueChange={(value) => update('type', value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="seasonal">Seasonal</SelectItem>
                    <SelectItem value="weekend">Weekend</SelectItem>
                    <SelectItem value="holiday">Holiday</SelectItem>
                    <SelectItem value="promotional">Promotional / promo code</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Apply as</Label>
                <Select value={form.applyMode} onValueChange={(value) => update('applyMode', value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="multiplier">Rate multiplier</SelectItem>
                    <SelectItem value="flat_rate">Flat rate</SelectItem>
                    <SelectItem value="override">Override rate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <PriceField label="Start date" type="date" value={form.startDate} onChange={(value) => update('startDate', value)} required />
              <PriceField label="End date" type="date" value={form.endDate} onChange={(value) => update('endDate', value)} required />
              {form.applyMode === 'multiplier' ? (
                <PriceField label="Multiplier" type="number" min="0.01" step="0.01" value={form.multiplier} onChange={(value) => update('multiplier', value)} required />
              ) : (
                <PriceField label="Flat rate" type="number" min="0" step="0.01" value={form.flatRate} onChange={(value) => update('flatRate', value)} required />
              )}
              <PriceField label="Priority" type="number" min="0" step="1" value={form.priority} onChange={(value) => update('priority', value)} />
              {weekend && (
                <div className="space-y-2 sm:col-span-2">
                  <Label>Days of week</Label>
                  <div className="flex flex-wrap gap-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => {
                      const active = form.daysOfWeek.includes(index);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() =>
                            update(
                              'daysOfWeek',
                              active ? form.daysOfWeek.filter((value) => value !== index) : [...form.daysOfWeek, index],
                            )
                          }
                          className={`border px-3 py-1.5 text-xs uppercase tracking-wide ${
                            active
                              ? 'border-foreground bg-foreground text-background'
                              : 'border-border bg-card text-foreground/70 hover:text-foreground'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {promo && (
                <>
                  <PriceField label="Coupon code" value={form.couponCode} onChange={(value) => update('couponCode', value.toUpperCase())} required />
                  <PriceField label="Max uses" type="number" min="0" step="1" value={form.maxUses} onChange={(value) => update('maxUses', value)} />
                </>
              )}
              <div className="flex items-center gap-3 sm:col-span-2">
                <Switch checked={form.isActive} onCheckedChange={(value) => update('isActive', value)} />
                <Label>Active</Label>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="price-description">Description</Label>
                <Textarea
                  id="price-description"
                  value={form.description}
                  onChange={(event) => update('description', event.target.value)}
                  rows={3}
                  placeholder="Notes shown to managers about this rule"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setForm(null)}>Cancel</Button>
              <Button type="submit" disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {saving ? 'Saving…' : form.id ? 'Save changes' : 'Create rule'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function PriceField({ label, value, onChange, ...props }: { label: string; value: string; onChange: (value: string) => void } & Omit<React.ComponentProps<typeof Input>, 'value' | 'onChange'>) {
  const id = `price-${label.replace(/\W/g, '-')}`;
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} onChange={(event) => onChange(event.target.value)} {...props} />
    </div>
  );
}