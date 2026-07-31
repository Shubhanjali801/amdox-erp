import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Clock, Plus, Trash2 } from 'lucide-react';
import { hrService } from '../../services/hrService';
import { Employee } from '../../types/hr';

const today = new Date().toISOString().slice(0, 10);

export default function Attendance() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    employeeId: '',
    date: today,
    clockIn: `${today}T09:00`,
    clockOut: `${today}T18:00`,
    status: 'PRESENT',
    notes: '',
  });

  const employeesQuery = useQuery({
    queryKey: ['hr-employees-attendance'],
    queryFn: async () => (await hrService.employees.list({ limit: 100 })).data.data,
  });

  const attendanceQuery = useQuery({
    queryKey: ['hr-attendance'],
    queryFn: async () => (await hrService.attendance.list({ limit: 100 })).data.data,
  });

  const createMutation = useMutation({
    mutationFn: () => hrService.attendance.create({
      ...form,
      clockIn: form.clockIn ? new Date(form.clockIn).toISOString() : null,
      clockOut: form.clockOut ? new Date(form.clockOut).toISOString() : null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-attendance'] });
      setForm(current => ({ ...current, notes: '' }));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => hrService.attendance.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hr-attendance'] }),
  });

  const employees = employeesQuery.data || [];
  const rows = attendanceQuery.data || [];

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createMutation.mutate();
  };

  return (
    <div className="hr-light min-h-screen bg-slate-950 p-6 text-slate-100">
      <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[360px_1fr]">
        <section className="rounded-lg border border-slate-800 bg-slate-900/70">
          <div className="border-b border-slate-800 p-4">
            <p className="text-sm font-medium text-amber-300">F-04 HR & Payroll</p>
            <h1 className="mt-1 text-2xl font-semibold text-white">Attendance</h1>
          </div>
          <form onSubmit={handleSubmit} className="grid gap-4 p-4">
            <Field label="Employee">
              <select required className={inputClass} value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })}>
                <option value="">Select employee</option>
                {employees.map((employee: Employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.employeeCode} - {employee.user.firstName} {employee.user.lastName}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Date">
              <input required type="date" className={inputClass} value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Clock in">
                <input type="datetime-local" className={inputClass} value={form.clockIn} onChange={e => setForm({ ...form, clockIn: e.target.value })} />
              </Field>
              <Field label="Clock out">
                <input type="datetime-local" className={inputClass} value={form.clockOut} onChange={e => setForm({ ...form, clockOut: e.target.value })} />
              </Field>
            </div>
            <Field label="Status">
              <select className={inputClass} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                {['PRESENT', 'ABSENT', 'HALF_DAY', 'HOLIDAY', 'WORK_FROM_HOME'].map(status => (
                  <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>
                ))}
              </select>
            </Field>
            <Field label="Notes">
              <textarea className={`${inputClass} h-24 py-2`} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </Field>
            <button disabled={createMutation.isPending} className="inline-flex items-center justify-center gap-2 rounded-md bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-300 disabled:opacity-60">
              <Plus size={16} />
              Save attendance
            </button>
          </form>
        </section>

        <section className="rounded-lg border border-slate-800 bg-slate-900/70">
          <div className="flex items-center gap-2 border-b border-slate-800 p-4">
            <Clock size={18} className="text-amber-300" />
            <h2 className="text-lg font-semibold text-white">Recent attendance</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800 text-sm">
              <thead className="bg-slate-950/60 text-left text-xs uppercase text-slate-500">
                <tr><th className="px-4 py-3">Employee</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Hours</th><th className="px-4 py-3 text-right">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {rows.map(row => (
                  <tr key={row.id}>
                    <td className="px-4 py-3">{row.employee?.user.firstName} {row.employee?.user.lastName}</td>
                    <td className="px-4 py-3 text-slate-300">{row.date.slice(0, 10)}</td>
                    <td className="px-4 py-3 text-slate-300">{row.status.replaceAll('_', ' ')}</td>
                    <td className="px-4 py-3 text-slate-300">{row.totalHours ?? '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <button title="Delete attendance" onClick={() => deleteMutation.mutate(row.id)} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-900/70 text-red-300 hover:bg-red-950">
                        <Trash2 size={15} />
                      </button>
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
