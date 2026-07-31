import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Save, Trash2, Users, X } from 'lucide-react';
import { hrService } from '../../services/hrService';
import { Department } from '../../types/hr';

export default function Organisation() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: '', code: '', parentId: '', managerId: '' });
  const [editingId, setEditingId] = useState<string | null>(null);

  const departmentsQuery = useQuery({
    queryKey: ['hr-organisation-departments'],
    queryFn: async () => (await hrService.organisation.departments()).data.data,
  });

  const chartQuery = useQuery({
    queryKey: ['hr-organisation-chart'],
    queryFn: async () => (await hrService.organisation.chart()).data.data,
  });

  const resetForm = () => {
    setEditingId(null);
    setForm({ name: '', code: '', parentId: '', managerId: '' });
  };

  const invalidateOrganisation = () => {
    queryClient.invalidateQueries({ queryKey: ['hr-organisation-departments'] });
    queryClient.invalidateQueries({ queryKey: ['hr-organisation-chart'] });
  };

  const payloadFromForm = () => ({
    name: form.name,
    code: form.code || undefined,
    parentId: form.parentId || undefined,
    managerId: form.managerId || undefined,
  });

  const createMutation = useMutation({
    mutationFn: () => hrService.organisation.createDepartment(payloadFromForm()),
    onSuccess: () => {
      invalidateOrganisation();
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => hrService.organisation.updateDepartment(editingId!, payloadFromForm()),
    onSuccess: () => {
      invalidateOrganisation();
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => hrService.organisation.removeDepartment(id),
    onSuccess: () => {
      invalidateOrganisation();
      resetForm();
    },
  });

  const departments = departmentsQuery.data || [];
  const chart = chartQuery.data || [];
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (editingId) {
      updateMutation.mutate();
      return;
    }
    createMutation.mutate();
  };

  const startEdit = (department: Department) => {
    setEditingId(department.id);
    setForm({
      name: department.name,
      code: department.code || '',
      parentId: department.parentId || '',
      managerId: department.managerId || '',
    });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this department? Move employees first if this department has people assigned.')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="hr-light min-h-screen bg-slate-950 p-6 text-slate-100">
      <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[360px_1fr]">
        <section className="rounded-lg border border-slate-800 bg-slate-900/70">
          <div className="flex items-start justify-between gap-3 border-b border-slate-800 p-4">
            <div>
              <p className="text-sm font-medium text-amber-300">F-04 HR & Payroll</p>
              <h1 className="mt-1 text-2xl font-semibold text-white">Organisation</h1>
            </div>
            {editingId && (
              <button type="button" onClick={resetForm} className={ghostButtonClass} title="Cancel edit">
                <X size={16} />
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4 p-4">
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-slate-300">Department name</span>
              <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputClass} />
            </label>
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-slate-300">Code</span>
              <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} className={inputClass} />
            </label>
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-slate-300">Parent department</span>
              <select value={form.parentId} onChange={e => setForm({ ...form, parentId: e.target.value })} className={inputClass}>
                <option value="">No parent</option>
                {departments
                  .filter(department => department.id !== editingId)
                  .map(department => (
                    <option key={department.id} value={department.id}>{department.name}</option>
                  ))}
              </select>
            </label>
            <button disabled={isSaving} className="inline-flex items-center justify-center gap-2 rounded-md bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-300 disabled:opacity-60">
              {editingId ? <Save size={16} /> : <Plus size={16} />}
              {editingId ? 'Save department' : 'Add department'}
            </button>
          </form>

          <div className="border-t border-slate-800 p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Departments</h2>
            <div className="mt-3 grid gap-2">
              {departments.map(department => (
                <article key={department.id} className="flex items-center justify-between gap-3 rounded-md border border-slate-800 bg-slate-950 px-3 py-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-white">{department.name}</div>
                    <div className="text-xs text-slate-500">{department.code || 'No code'}</div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button type="button" onClick={() => startEdit(department)} className={ghostButtonClass} title="Edit department">
                      <Pencil size={15} />
                    </button>
                    <button type="button" onClick={() => handleDelete(department.id)} className={dangerButtonClass} title="Delete department">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </article>
              ))}
              {!departmentsQuery.isLoading && departments.length === 0 && (
                <div className="rounded-md border border-dashed border-slate-700 px-3 py-4 text-sm text-slate-500">No departments yet.</div>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-slate-800 bg-slate-900/70">
          <div className="flex items-center gap-2 border-b border-slate-800 p-4">
            <Users size={18} className="text-amber-300" />
            <h2 className="text-lg font-semibold text-white">Org chart</h2>
          </div>
          <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
            {chart.map(node => (
              <article key={String(node.id)} className="rounded-md border border-slate-800 bg-slate-950 p-4">
                <div className="text-sm font-semibold text-white">{String(node.name || '')}</div>
                <div className="mt-1 text-xs text-slate-400">{String(node.employeeCode || '')} - {String(node.designation || '')}</div>
                <div className="mt-2 text-xs text-slate-500">{String((node.department as { name?: string } | undefined)?.name || 'Unassigned')}</div>
              </article>
            ))}
            {!chartQuery.isLoading && chart.length === 0 && (
              <div className="rounded-md border border-dashed border-slate-700 px-4 py-8 text-sm text-slate-500">No employees available for the org chart.</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

const inputClass = 'w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-amber-300';
const ghostButtonClass = 'inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-700 text-slate-300 hover:border-amber-300 hover:text-amber-200';
const dangerButtonClass = 'inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-700 text-slate-300 hover:border-rose-400 hover:text-rose-200';
