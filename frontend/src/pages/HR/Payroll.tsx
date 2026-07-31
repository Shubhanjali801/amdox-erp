import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ban, Play, Trash2 } from 'lucide-react';
import { hrService } from '../../services/hrService';

const defaultPeriod = new Date().toISOString().slice(0, 7);
const money = (value: number | string, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(Number(value || 0));

export default function Payroll() {
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState(defaultPeriod);
  const [currency, setCurrency] = useState('INR');

  const payrollQuery = useQuery({
    queryKey: ['hr-payroll'],
    queryFn: async () => (await hrService.payroll.list()).data.data,
  });

  const runMutation = useMutation({
    mutationFn: () => hrService.payroll.run({ period, currency }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hr-payroll'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => hrService.payroll.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hr-payroll'] }),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => hrService.payroll.cancel(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hr-payroll'] }),
  });

  const handleRun = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    runMutation.mutate();
  };

  const runs = payrollQuery.data || [];

  return (
    <div className="hr-light min-h-screen bg-slate-950 p-6 text-slate-100">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <header className="flex flex-col gap-4 border-b border-slate-800 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-amber-300">F-04 HR & Payroll</p>
            <h1 className="mt-1 text-3xl font-semibold text-white">Payroll Runs</h1>
            <p className="mt-2 text-sm text-slate-400">Run gross-to-net payroll and generate payslip rows for active employees.</p>
          </div>
          <form onSubmit={handleRun} className="flex flex-wrap items-end gap-3">
            <label className="grid gap-1 text-sm text-slate-300">
              Period
              <input required type="month" value={period} onChange={e => setPeriod(e.target.value)} className={inputClass} />
            </label>
            <label className="grid gap-1 text-sm text-slate-300">
              Currency
              <input required maxLength={3} value={currency} onChange={e => setCurrency(e.target.value.toUpperCase())} className={`${inputClass} w-24`} />
            </label>
            <button disabled={runMutation.isPending} className="inline-flex items-center gap-2 rounded-md bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-300 disabled:opacity-60">
              <Play size={16} />
              Run payroll
            </button>
          </form>
        </header>

        {runMutation.error instanceof Error && <div className="rounded-md border border-red-900/70 bg-red-950/60 p-3 text-sm text-red-200">{runMutation.error.message}</div>}

        <section className="rounded-lg border border-slate-800 bg-slate-900/70">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800 text-sm">
              <thead className="bg-slate-950/60 text-left text-xs uppercase text-slate-500">
                <tr><th className="px-4 py-3">Period</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Employees</th><th className="px-4 py-3">Gross</th><th className="px-4 py-3">Deductions</th><th className="px-4 py-3">Net</th><th className="px-4 py-3 text-right">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {runs.map(run => (
                  <tr key={run.id}>
                    <td className="px-4 py-3 font-medium text-white">{run.period}</td>
                    <td className="px-4 py-3 text-slate-300">{run.status}</td>
                    <td className="px-4 py-3 text-slate-300">{run.totalEmployees}</td>
                    <td className="px-4 py-3 text-slate-300">{money(run.totalGross, run.currency)}</td>
                    <td className="px-4 py-3 text-slate-300">{money(run.totalDeductions, run.currency)}</td>
                    <td className="px-4 py-3 text-slate-300">{money(run.totalNet, run.currency)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          title="Cancel payroll run"
                          disabled={run.status === 'CANCELLED' || cancelMutation.isPending}
                          onClick={() => cancelMutation.mutate(run.id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-700 text-slate-300 hover:border-amber-300 hover:text-amber-200 disabled:opacity-40"
                        >
                          <Ban size={15} />
                        </button>
                        <button
                          title="Delete payroll run"
                          onClick={() => {
                            if (window.confirm('Delete this payroll run and its payslips?')) deleteMutation.mutate(run.id);
                          }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-900/70 text-red-300 hover:bg-red-950"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
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

const inputClass = 'rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-amber-300';
