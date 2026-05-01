type Props = {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (next: number) => void;
  disabled?: boolean;
};

export default function Pagination({
  page,
  totalPages,
  total,
  onPageChange,
  disabled,
}: Props) {
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
      <span>
        Page {page} of {totalPages}
        <span className="text-zinc-500"> · {total} rows</span>
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={disabled || !canPrev}
          onClick={() => onPageChange(page - 1)}
          className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 font-medium text-zinc-800 shadow-sm hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={disabled || !canNext}
          onClick={() => onPageChange(page + 1)}
          className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 font-medium text-zinc-800 shadow-sm hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
