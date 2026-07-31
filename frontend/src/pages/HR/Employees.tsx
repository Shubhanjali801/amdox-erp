import { FormEvent, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit2, Plus, RefreshCw, Save, Search, Trash2, X } from 'lucide-react';
import { hrService } from '../../services/hrService';
import { Department, Employee, EmployeeFormData, EmployeeStatus, EmploymentType, PayFrequency } from '../../types/hr';
import { useHrStore } from '../../store/hrSlice';

const defaultForm: EmployeeFormData = {
  employeeCode: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  departmentId: '',
  designation: '',
  managerId: '',
  employmentType: 'FULL_TIME',
  status: 'ACTIVE',
  joinDate: new Date().toISOString().slice(0, 10),
  baseSalary: 0,
  currency: 'INR',
  payFrequency: 'MONTHLY',
};

const statusOptions: EmployeeStatus[] = ['ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED'];
const employmentOptions: EmploymentType[] = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN'];
const frequencyOptions: PayFrequency[] = ['WEEKLY', 'BI_WEEKLY', 'MONTHLY', 'QUARTERLY'];

const toDateInput = (value: string) => new Date(value).toISOString().slice(0, 10);
const formatMoney = (amount: number | string, currency: string) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(Number(amount || 0));

const mapEmployeeToForm = (employee: Employee): EmployeeFormData => ({
  employeeCode: employee.employeeCode,
  firstName: employee.user.firstName,
  lastName: employee.user.lastName,
  email: employee.user.email,
  phone: employee.user.phone || '',
  departmentId: employee.departmentId || '',
  designation: employee.designation,
  managerId: employee.managerId || '',
  employmentType: employee.employmentType,
  status: employee.status,
  joinDate: toDateInput(employee.joinDate),
  baseSalary: Number(employee.baseSalary),
  currency: employee.currency,
  payFrequency: employee.payFrequency,
});

export default function Employees() {
  const queryClient = useQueryClient();
  const { setEmployees, setSelectedEmployee } = useHrStore();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EmployeeFormData>(defaultForm);
  const [formOpen, setFormOpen] = useState(false);

  const employeeQuery = useQuery({
    queryKey: ['hr-employees', search, status, departmentId],
    queryFn: async () => {
      const response = await hrService.employees.list({
        page: 1,
        limit: 50,
        search: search || undefined,
        status: status || undefined,
        departmentId: departmentId || undefined,
      });
      setEmployees(response.data.data);
      return response.data;
    },
  });

  const departmentQuery = useQuery({
    queryKey: ['hr-departments'],
    queryFn: async () => {
      const response = await hrService.employees.departments();
      return response.data.data;
    },
  });

  const employees = employeeQuery.data?.data || [];
  const departments = departmentQuery.data || [];

  const activeManagers = useMemo(
    () => employees.filter(employee => employee.status !== 'TERMINATED' && employee.id !== editingId),
    [editingId, employees]
  );

  const saveMutation = useMutation({
    mutationFn: () =>
      editingId
        ? hrService.employees.update(editingId, normalizeForm(form))
        : hrService.employees.create(normalizeForm(form)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-employees'] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => hrService.employees.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-employees'] });
    },
  });

  const resetForm = () => {
    setEditingId(null);
    setSelectedEmployee(null);
    setForm(defaultForm);
    setFormOpen(false);
  };

  const startCreate = () => {
    setEditingId(null);
    setSelectedEmployee(null);
    setForm(defaultForm);
    setFormOpen(true);
  };

  const startEdit = (employee: Employee) => {
    setEditingId(employee.id);
    setSelectedEmployee(employee);
    setForm(mapEmployeeToForm(employee));
    setFormOpen(true);
  };

  const updateField = <K extends keyof EmployeeFormData>(key: K, value: EmployeeFormData[K]) => {
    setForm(current => ({ ...current, [key]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    saveMutation.mutate();
  };

  const errorMessage =
    employeeQuery.error instanceof Error
      ? employeeQuery.error.message
      : saveMutation.error instanceof Error
        ? saveMutation.error.message
        : deleteMutation.error instanceof Error
          ? deleteMutation.error.message
          : '';

  return (
    <div className="hr-light min-h-screen bg-slate-950 p-6 text-slate-100">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <header className="flex flex-col gap-3 border-b border-slate-800 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-amber-300">F-04 HR & Payroll</p>
            <h1 className="mt-1 text-3xl font-semibold text-white">Employee Master</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Manage employee records used by leave, attendance, payroll, and organisation routes.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              title="Refresh employees"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['hr-employees'] })}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-700 text-slate-200 hover:bg-slate-900"
            >
              <RefreshCw size={18} />
            </button>
            <button
              type="button"
              onClick={startCreate}
              className="inline-flex items-center gap-2 rounded-md bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-300"
            >
              <Plus size={18} />
              Add employee
            </button>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="rounded-lg border border-slate-800 bg-slate-900/70">
            <div className="grid gap-3 border-b border-slate-800 p-4 md:grid-cols-[1fr_180px_220px]">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  value={search}
                  onChange={event => setSearch(event.target.value)}
                  placeholder="Search name, email, code, designation"
                  className="h-10 w-full rounded-md border border-slate-700 bg-slate-950 pl-10 pr-3 text-sm text-white outline-none focus:border-amber-300"
                />
              </label>
              <select
                value={status}
                onChange={event => setStatus(event.target.value)}
                className="h-10 rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none focus:border-amber-300"
              >
                <option value="">All statuses</option>
                {statusOptions.map(option => (
                  <option key={option} value={option}>{label(option)}</option>
                ))}
              </select>
              <select
                value={departmentId}
                onChange={event => setDepartmentId(event.target.value)}
                className="h-10 rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none focus:border-amber-300"
              >
                <option value="">All departments</option>
                {departments.map(department => (
                  <option key={department.id} value={department.id}>{department.name}</option>
                ))}
              </select>
            </div>

            {errorMessage && (
              <div className="border-b border-red-900/70 bg-red-950/60 px-4 py-3 text-sm text-red-200">
                {errorMessage}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-800 text-sm">
                <thead className="bg-slate-950/60 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Employee</th>
                    <th className="px-4 py-3 font-semibold">Department</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Salary</th>
                    <th className="px-4 py-3 font-semibold">Joined</th>
                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {employeeQuery.isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400">Loading employees...</td>
                    </tr>
                  ) : employees.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400">No employees found.</td>
                    </tr>
                  ) : (
                    employees.map(employee => (
                      <tr key={employee.id} className="hover:bg-slate-800/40">
                        <td className="px-4 py-4">
                          <div className="font-medium text-white">
                            {employee.user.firstName} {employee.user.lastName}
                          </div>
                          <div className="mt-1 text-xs text-slate-400">
                            {employee.employeeCode} · {employee.user.email}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">{employee.designation}</div>
                        </td>
                        <td className="px-4 py-4 text-slate-300">
                          {employee.department?.name || 'Unassigned'}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusTone(employee.status)}`}>
                            {label(employee.status)}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-slate-300">
                          {formatMoney(employee.baseSalary, employee.currency)}
                        </td>
                        <td className="px-4 py-4 text-slate-300">
                          {toDateInput(employee.joinDate)}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              title="Edit employee"
                              onClick={() => startEdit(employee)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              type="button"
                              title="Delete employee"
                              onClick={() => deleteMutation.mutate(employee.id)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-red-900/70 text-red-300 hover:bg-red-950"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <EmployeeForm
            departments={departments}
            employees={activeManagers}
            editingId={editingId}
            form={form}
            formOpen={formOpen}
            saving={saveMutation.isPending}
            onCancel={resetForm}
            onCreate={startCreate}
            onSubmit={handleSubmit}
            updateField={updateField}
          />
        </section>
      </div>
    </div>
  );
}

interface EmployeeFormProps {
  departments: Department[];
  employees: Employee[];
  editingId: string | null;
  form: EmployeeFormData;
  formOpen: boolean;
  saving: boolean;
  onCancel: () => void;
  onCreate: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  updateField: <K extends keyof EmployeeFormData>(key: K, value: EmployeeFormData[K]) => void;
}

function EmployeeForm({
  departments,
  employees,
  editingId,
  form,
  formOpen,
  saving,
  onCancel,
  onCreate,
  onSubmit,
  updateField,
}: EmployeeFormProps) {
  if (!formOpen) {
    return (
      <aside className="flex min-h-[360px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-700 bg-slate-900/40 p-6 text-center">
        <h2 className="text-lg font-semibold text-white">Employee form</h2>
        <p className="mt-2 text-sm text-slate-400">Select a row to edit or add a new employee.</p>
        <button
          type="button"
          onClick={onCreate}
          className="mt-5 inline-flex items-center gap-2 rounded-md bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-300"
        >
          <Plus size={18} />
          Add employee
        </button>
      </aside>
    );
  }

  return (
    <aside className="rounded-lg border border-slate-800 bg-slate-900/70">
      <div className="flex items-center justify-between border-b border-slate-800 p-4">
        <h2 className="text-lg font-semibold text-white">{editingId ? 'Edit employee' : 'Add employee'}</h2>
        <button
          type="button"
          title="Close form"
          onClick={onCancel}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800"
        >
          <X size={16} />
        </button>
      </div>

      <form onSubmit={onSubmit} className="grid gap-4 p-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name">
            <input required value={form.firstName} onChange={event => updateField('firstName', event.target.value)} className={inputClass} />
          </Field>
          <Field label="Last name">
            <input required value={form.lastName} onChange={event => updateField('lastName', event.target.value)} className={inputClass} />
          </Field>
        </div>

        <Field label="Email">
          <input required type="email" value={form.email} onChange={event => updateField('email', event.target.value)} className={inputClass} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Employee code">
            <input required value={form.employeeCode} onChange={event => updateField('employeeCode', event.target.value)} className={inputClass} />
          </Field>
          <Field label="Phone">
            <input value={form.phone} onChange={event => updateField('phone', event.target.value)} className={inputClass} />
          </Field>
        </div>

        <Field label="Designation">
          <input required value={form.designation} onChange={event => updateField('designation', event.target.value)} className={inputClass} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Department">
            <select value={form.departmentId} onChange={event => updateField('departmentId', event.target.value)} className={inputClass}>
              <option value="">Unassigned</option>
              {departments.map(department => (
                <option key={department.id} value={department.id}>{department.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Manager">
            <select value={form.managerId} onChange={event => updateField('managerId', event.target.value)} className={inputClass}>
              <option value="">No manager</option>
              {employees.map(employee => (
                <option key={employee.id} value={employee.id}>
                  {employee.user.firstName} {employee.user.lastName}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Employment">
            <select value={form.employmentType} onChange={event => updateField('employmentType', event.target.value as EmploymentType)} className={inputClass}>
              {employmentOptions.map(option => (
                <option key={option} value={option}>{label(option)}</option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select value={form.status} onChange={event => updateField('status', event.target.value as EmployeeStatus)} className={inputClass}>
              {statusOptions.map(option => (
                <option key={option} value={option}>{label(option)}</option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Join date">
            <input required type="date" value={form.joinDate} onChange={event => updateField('joinDate', event.target.value)} className={inputClass} />
          </Field>
          <Field label="Pay frequency">
            <select value={form.payFrequency} onChange={event => updateField('payFrequency', event.target.value as PayFrequency)} className={inputClass}>
              {frequencyOptions.map(option => (
                <option key={option} value={option}>{label(option)}</option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-[90px_1fr] gap-3">
          <Field label="Currency">
            <input required maxLength={3} value={form.currency} onChange={event => updateField('currency', event.target.value.toUpperCase())} className={inputClass} />
          </Field>
          <Field label="Base salary">
            <input
              required
              min={1}
              type="number"
              value={form.baseSalary || ''}
              onChange={event => updateField('baseSalary', Number(event.target.value))}
              className={inputClass}
            />
          </Field>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-800 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-2 rounded-md border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
          >
            <X size={16} />
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-md bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </aside>
  );
}

function Field({ label: fieldLabel, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-medium text-slate-300">{fieldLabel}</span>
      {children}
    </label>
  );
}

const inputClass =
  'h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none focus:border-amber-300';

const label = (value: string) =>
  value
    .toLowerCase()
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const statusTone = (status: EmployeeStatus) => {
  if (status === 'ACTIVE') return 'bg-emerald-950 text-emerald-300';
  if (status === 'ON_LEAVE') return 'bg-amber-950 text-amber-300';
  if (status === 'SUSPENDED') return 'bg-red-950 text-red-300';
  return 'bg-slate-800 text-slate-300';
};

const normalizeForm = (form: EmployeeFormData): EmployeeFormData => ({
  ...form,
  departmentId: form.departmentId || undefined,
  managerId: form.managerId || undefined,
  phone: form.phone || undefined,
  currency: form.currency.toUpperCase(),
});
