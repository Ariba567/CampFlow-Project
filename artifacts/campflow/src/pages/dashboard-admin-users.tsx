import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import ErrorState from '@/components/ui/error-state';
import { DataTable, type DataColumn } from '@/components/operations/DataTable';
import { DataTableControls } from '@/components/operations/DataTableControls';
import { DataTablePagination } from '@/components/operations/DataTablePagination';
import OperationsStatusBadge from '@/components/operations/OperationsStatusBadge';
import { apiError, idOf, type ApiItem } from '@/services/operationsDashboardService';
import { createManagedUser, deleteManagedUser, getManagedUser, listAdminUsers, reassignUserRole, updateManagedUser } from '@/services/adminManagementService';
import { useAuth } from '@/hooks/useAuth';

type UserForm = {
  id?: string;
  originalRole?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role: 'customer' | 'manager' | 'admin';
  isActive: boolean;
};

const blankForm = (): UserForm => ({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  role: 'customer',
  isActive: true,
});

const toForm = (item: ApiItem): UserForm => ({
  id: idOf(item),
  originalRole: item.role,
  firstName: item.firstName ?? '',
  lastName: item.lastName ?? '',
  email: item.email ?? '',
  phone: item.phone ?? '',
  password: '',
  role: item.role ?? 'customer',
  isActive: item.isActive !== false,
});

const roleTone = (role?: string): 'default' | 'secondary' | 'outline' => {
  if (role === 'admin') return 'default';
  if (role === 'manager') return 'secondary';
  return 'outline';
};

export default function DashboardAdminUsers() {
  const { user: currentUser } = useAuth();
  const [data, setData] = useState<{ rows: ApiItem[]; page: number; totalPages: number }>({ rows: [], page: 1, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<UserForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingUser, setLoadingUser] = useState(false);

  const load = (page = data.page) => {
    setLoading(true);
    listAdminUsers({
      page,
      limit: 20,
      search: search || undefined,
      role: filter === 'all' ? undefined : filter,
    })
      .then((result) => setData({ rows: result.data, page: result.meta.page, totalPages: result.meta.totalPages }))
      .catch((caught) => setError(apiError(caught, 'We could not load users.')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timer = window.setTimeout(() => load(1), 180);
    return () => window.clearTimeout(timer);
  }, [search, filter]);

  const edit = async (item: ApiItem) => {
    setLoadingUser(true);
    try {
      setForm(toForm(await getManagedUser(idOf(item), item.role)));
    } catch (caught) {
      setError(apiError(caught, 'We could not load this account.'));
    } finally {
      setLoadingUser(false);
    }
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form) return;
    const isNew = !form.id;
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || (isNew && form.password.length < 8)) {
      setError('Enter a first name, last name, email, and a secure password for new accounts.');
      return;
    }
    const input = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || undefined,
      password: form.password || undefined,
      isActive: form.isActive,
    };
    setSaving(true);
    try {
      if (isNew) {
        await createManagedUser(form.role, { ...input, password: form.password });
      } else {
        await updateManagedUser(form.id!, form.originalRole!, input);
        if (form.role !== form.originalRole) await reassignUserRole(form.id!, form.role);
      }
      toast.success(isNew ? 'Account created' : 'Account updated');
      setForm(null);
      load();
    } catch (caught) {
      setError(apiError(caught, 'We could not save this account.'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item: ApiItem) => {
    if (idOf(item) === currentUser?.id) {
      setError('You cannot delete your own administrator account.');
      return;
    }
    if (!window.confirm(`Delete ${item.firstName} ${item.lastName}? This cannot be undone.`)) return;
    try {
      await deleteManagedUser(idOf(item), item.role);
      toast.success('Account deleted');
      load();
    } catch (caught) {
      setError(apiError(caught, 'We could not delete this account.'));
    }
  };

  const columns: DataColumn<ApiItem>[] = [
    {
      label: 'Account',
      cell: (row) => (
        <div>
          <p className="font-medium leading-tight">
            {row.firstName} {row.lastName}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">{row.email}</p>
        </div>
      ),
    },
    {
      label: 'Role',
      cell: (row) => (
        <Badge variant={roleTone(row.role)} className="capitalize">
          {row.role}
        </Badge>
      ),
    },
    {
      label: 'Status',
      cell: (row) =>
        row.isActive === false ? (
          <OperationsStatusBadge status="cancelled" />
        ) : (
          <OperationsStatusBadge status="confirmed" />
        ),
    },
    { label: 'Joined', cell: (row) => <span className="font-mono text-sm">{String(row.createdAt ?? '').slice(0, 10)}</span> },
    {
      label: '',
      className: 'text-right',
      cell: (row) => (
        <div className="flex justify-end gap-1">
          <Button size="icon" variant="ghost" title="Edit account" onClick={() => void edit(row)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            title="Delete account"
            disabled={idOf(row) === currentUser?.id}
            onClick={() => void remove(row)}
          >
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      ),
    },
  ];

  const customerCount = data.rows.filter((row) => row.role === 'customer').length;
  const managerCount = data.rows.filter((row) => row.role === 'manager').length;
  const adminCount = data.rows.filter((row) => row.role === 'admin').length;

  return (
    <div className="space-y-8">
      <section className="flex flex-wrap items-end justify-between gap-6 border-b border-border/60 pb-8">
        <div className="max-w-2xl">
          <p className="eyebrow">Administrator</p>
          <h1 className="mt-3 display-2">User management</h1>
          <p className="lede mt-4">Author new accounts, assign operational roles, and steward the people who keep CampFlow running.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => load(1)} disabled={loading}>
            Refresh
          </Button>
          <Button onClick={() => setForm(blankForm())}>
            <Plus />Add account
          </Button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-4">
        <KpiTile label="Total accounts" value={String(data.rows.length)} detail="Across the organization" />
        <KpiTile label="Customers" value={String(customerCount)} detail="Booking guests" />
        <KpiTile label="Managers" value={String(managerCount)} detail="Operational staff" />
        <KpiTile label="Administrators" value={String(adminCount)} detail="Privileged accounts" />
      </section>

      {error && <ErrorState title="Users unavailable" message={error} />}

      <Card className="overflow-hidden border-border/60 shadow-soft">
        <div className="border-b border-border/60 px-5 py-4">
          <p className="eyebrow">Directory</p>
          <h2 className="mt-1 display-3">All accounts</h2>
        </div>
        <DataTableControls
          search={search}
          onSearch={setSearch}
          filter={filter}
          onFilter={setFilter}
          filterOptions={[
            { value: 'all', label: 'All accounts' },
            { value: 'customer', label: 'Customers' },
            { value: 'manager', label: 'Managers' },
            { value: 'admin', label: 'Administrators' },
          ]}
          placeholder="Search people or email…"
        />
        {loading ? (
          <div className="grid min-h-64 place-items-center">
            <Spinner className="size-6 text-primary" />
          </div>
        ) : data.rows.length ? (
          <>
            <DataTable columns={columns} rows={data.rows} rowKey={idOf} />
            <DataTablePagination page={data.page} totalPages={data.totalPages} onPageChange={load} />
          </>
        ) : (
          <CardContent className="p-12 text-center text-sm text-muted-foreground">No accounts match these controls.</CardContent>
        )}
      </Card>

      <UserDialog form={form} setForm={setForm} saving={saving || loadingUser} selfId={currentUser?.id} onSave={save} />
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

function UserDialog({
  form,
  setForm,
  saving,
  selfId,
  onSave,
}: {
  form: UserForm | null;
  setForm: (form: UserForm | null) => void;
  saving: boolean;
  selfId?: string;
  onSave: (event: React.FormEvent) => void;
}) {
  const update = (field: keyof UserForm, value: string | boolean) => form && setForm({ ...form, [field]: value });
  const isSelf = form?.id === selfId;
  return (
    <Dialog open={!!form || saving} onOpenChange={(open) => !open && !saving && setForm(null)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl tracking-tight">
            {form?.id ? 'Manage account' : 'Add account'}
          </DialogTitle>
        </DialogHeader>
        {saving && !form ? (
          <div className="grid min-h-32 place-items-center">
            <Spinner className="size-6 text-primary" />
          </div>
        ) : (
          form && (
            <form className="space-y-6" onSubmit={onSave}>
              <section>
                <p className="eyebrow">Profile</p>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <AccountField label="First name" value={form.firstName} onChange={(value) => update('firstName', value)} required />
                  <AccountField label="Last name" value={form.lastName} onChange={(value) => update('lastName', value)} required />
                  <AccountField label="Email" type="email" value={form.email} onChange={(value) => update('email', value)} required />
                  <AccountField label="Phone" value={form.phone} onChange={(value) => update('phone', value)} />
                  <AccountField
                    label={form.id ? 'New password (optional)' : 'Password'}
                    type="password"
                    minLength={form.id ? undefined : 8}
                    value={form.password}
                    onChange={(value) => update('password', value)}
                    required={!form.id}
                  />
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select value={form.role} onValueChange={(value) => update('role', value)} disabled={isSelf}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="customer">Customer</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="admin">Administrator</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </section>

              <section>
                <p className="eyebrow">Status</p>
                <div className="mt-3 flex items-center justify-between rounded-md border border-border/60 bg-card px-4 py-3">
                  <div className="pr-4">
                    <p className="text-sm font-medium">Account active</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">Inactive accounts cannot use the application.</p>
                  </div>
                  <Switch checked={form.isActive} onCheckedChange={(value) => update('isActive', value)} disabled={isSelf} />
                </div>
                {isSelf && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Your own role and active status are protected from this screen.
                  </p>
                )}
              </section>

              <div className="flex items-center justify-end gap-2 border-t border-border/60 pt-4">
                <Button type="button" variant="ghost" onClick={() => setForm(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving…' : form.id ? 'Save changes' : 'Create account'}
                </Button>
              </div>
            </form>
          )
        )}
      </DialogContent>
    </Dialog>
  );
}

function AccountField({
  label,
  value,
  onChange,
  ...props
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
} & Omit<React.ComponentProps<typeof Input>, 'value' | 'onChange'>) {
  const id = `account-${label.replace(/\W/g, '-')}`;
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} onChange={(event) => onChange(event.target.value)} {...props} />
    </div>
  );
}