import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Plus, X } from 'lucide-react';
import { hrService } from '../../services/hrService';
import { Employee, LeaveType } from '../../types/hr';

const today = new Date().toISOString().slice(0, 10);

export default function Leave() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ employeeId: '', leaveTypeId: '', startDate: today, endDate: today, reason: '' });

  const employeesQuery = useQuery({
    queryKey: ['hr-employees-leave'],
    queryFn: async () => (await hrService.employees.list({ limit: 100 })).data.data,
  });
  const typesQuery = useQuery({ queryKey: ['hr-leave-types'], queryFn: async () => (await hrService.leave.types()).data.data });
  const leaveQuery = useQuery({ queryKey: ['hr-leave'], queryFn: async () => (await hrService.leave.list()).data.data });

  const createMutation = useMutation({
    mutationFn: () => hrService.leave.create(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-leave'] });
      setForm(current => ({ ...current, reason: '' }));
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => hrService.leave.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hr-leave'] }),
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createMutation.mutate();
  };

  const employees = employeesQuery.data || [];
  const leaveTypes = typesQuery.data || [];
  const rows = leaveQuery.data || [];

  return (
    <div className="hr-light min-h-screen bg-slate-950 p-6 text-slate-100">
      <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[360px_1fr]">
        <section className="rounded-lg border border-slate-800 bg-slate-900/70">
          <div className="border-b border-slate-800 p-4">
            <p className="text-sm font-medium text-amber-300">F-04 HR & Payroll</p>
            <h1 className="mt-1 text-2xl font-semibold text-white">Leave Requests</h1>
          </div>
          <form onSubmit={handleSubmit} className="grid gap-4 p-4">
            <Field label="Employee">
              <select required className={inputClass} value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })}>
                <option value="">Select employee</option>
                {employees.map((employee: Employee) => (
                  <option key={employee.id} value={employee.id}>{employee.employeeCode} - {employee.user.firstName} {employee.user.lastName}</option>
                ))}
              </select>
            </Field>
            <Field label="Leave type">
              <select required className={inputClass} value={form.leaveTypeId} onChange={e => setForm({ ...form, leaveTypeId: e.target.value })}>
                <option value="">Select type</option>
                {leaveTypes.map((type: LeaveType) => (
                  <option key={type.id} value={type.id}>{type.name} ({type.daysAllowedPerYear} days)</option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Start">
                <input required type="date" className={inputClass} value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
              </Field>
              <Field label="End">
                <input required type="date" className={inputClass} value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
              </Field>
            </div>
            <Field label="Reason">
              <textarea className={`${inputClass} h-24 py-2`} value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} />
            </Field>
            <button disabled={createMutation.isPending} className="inline-flex items-center justify-center gap-2 rounded-md bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-300 disabled:opacity-60">
              <Plus size={16} />
              Request leave
            </button>
          </form>
        </section>

        <section className="rounded-lg border border-slate-800 bg-slate-900/70">
          <h2 className="border-b border-slate-800 p-4 text-lg font-semibold text-white">Leave queue</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800 text-sm">
              <thead className="bg-slate-950/60 text-left text-xs uppercase text-slate-500">
                <tr><th className="px-4 py-3">Employee</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Dates</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Decision</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {rows.map(row => (
                  <tr key={row.id}>
                    <td className="px-4 py-3">{row.employee?.user.firstName} {row.employee?.user.lastName}</td>
                    <td className="px-4 py-3 text-slate-300">{row.leaveType?.name}</td>
                    <td className="px-4 py-3 text-slate-300">{row.startDate.slice(0, 10)} to {row.endDate.slice(0, 10)} ({row.totalDays}d)</td>
                    <td className="px-4 py-3 text-slate-300">{row.status}</td>
                    <td className="px-4 py-3 text-right">
                      <button title="Approve leave" onClick={() => statusMutation.mutate({ id: row.id, status: 'APPROVED' })} className="mr-2 inline-flex h-8 w-8 items-center justify-center rounded-md border border-emerald-900/70 text-emerald-300 hover:bg-emerald-950"><Check size={15} /></button>
                      <button title="Reject leave" onClick={() => statusMutation.mutate({ id: row.id, status: 'REJECTED' })} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-900/70 text-red-300 hover:bg-red-950"><X size={15} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-1.5 text-sm"><span className="font-medium text-slate-300">{label}</span>{children}</label>;
}

const inputClass = 'w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-amber-300';
