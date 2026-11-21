// Shared Tailwind class strings
const focus =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:focus-visible:outline-blue-400";

export const btnPrimary = `inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-55 dark:bg-blue-400 dark:text-slate-900 dark:hover:bg-blue-300 ${focus}`;

export const btnGhost = `inline-flex items-center gap-2 rounded-lg border-[1.5px] border-slate-300 px-3.5 py-2 font-medium hover:border-blue-600 dark:border-slate-600 dark:hover:border-blue-400 ${focus}`;

export const field = `rounded-lg border-[1.5px] border-slate-300 bg-white px-3.5 py-2.5 dark:border-slate-600 dark:bg-slate-800 ${focus}`;

export const card = "rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800";

export const link = "text-blue-700 underline-offset-2 hover:underline dark:text-blue-300";

export const muted = "text-slate-600 dark:text-slate-400";
