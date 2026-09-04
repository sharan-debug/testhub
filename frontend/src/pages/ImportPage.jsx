import { useState } from "react";
import { ArrowLeft, AlertCircle, CheckCircle2, CircleDot, FileSpreadsheet, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api } from "../lib/api";

function StatusChip({ row }) {
  if (row.is_duplicate) {
    return <span className="text-[10px] font-mono px-2 py-0.5 rounded-sm bg-amber-100 text-amber-700 border border-amber-200">duplicate</span>;
  }
  return <span className="text-[10px] font-mono px-2 py-0.5 rounded-sm bg-emerald-100 text-emerald-700 border border-emerald-200">new</span>;
}

export default function ImportPage() {
  const [file, setFile] = useState(null);
  const [step, setStep] = useState("select"); // select | preview | result
  const [previewing, setPreviewing] = useState(false);
  const [preview, setPreview] = useState(null);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const navigate = useNavigate();

  const onPreview = async () => {
    if (!file) { toast.error("Please choose a file"); return; }
    setPreviewing(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await api.post("/features/import/preview", fd, { headers: { "Content-Type": "multipart/form-data" } });
      if (r.data.total === 0) {
        toast.error("No valid rows found in the file");
        setPreviewing(false);
        return;
      }
      setPreview(r.data);
      setStep("preview");
    } catch (e) {
      toast.error(`Preview failed: ${e?.response?.data?.detail || e.message}`);
    }
    setPreviewing(false);
  };

  const onImport = async () => {
    setImporting(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("skip_duplicates", skipDuplicates ? "true" : "false");
      const r = await api.post("/features/import", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setResult(r.data);
      setStep("result");
      if (r.data.imported > 0) toast.success(`Imported ${r.data.imported} features`);
    } catch (e) {
      toast.error(`Import failed: ${e?.response?.data?.detail || e.message}`);
    }
    setImporting(false);
  };

  const reset = () => {
    setFile(null);
    setStep("select");
    setPreview(null);
    setResult(null);
    setSkipDuplicates(true);
  };

  if (step === "result") {
    return (
      <div className="p-6 md:p-8 max-w-3xl">
        <p className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-2">Bulk</p>
        <h1 className="text-3xl md:text-4xl font-heading font-black tracking-tight mb-6">Import complete</h1>

        <div className="bg-white border border-zinc-200 rounded-sm p-6" data-testid="import-result">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <p className="font-medium text-sm">{result.imported} feature{result.imported !== 1 ? "s" : ""} imported</p>
          </div>
          {result.skipped > 0 && (
            <p className="text-xs text-zinc-500 ml-6 mb-1">{result.skipped} duplicate{result.skipped !== 1 ? "s" : ""} skipped</p>
          )}
          {result.errors?.length > 0 && (
            <div className="mt-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <p className="font-medium text-sm">{result.errors.length} row error{result.errors.length !== 1 ? "s" : ""}</p>
              </div>
              <pre className="text-xs bg-zinc-50 border border-zinc-100 rounded-sm p-3 font-mono max-h-48 overflow-auto">{result.errors.join("\n")}</pre>
            </div>
          )}
          <div className="flex gap-2 mt-5">
            <button
              data-testid="import-view-features"
              type="button"
              onClick={() => navigate("/features")}
              className="h-9 px-4 text-sm bg-black hover:bg-zinc-800 text-white rounded-sm"
            >View features</button>
            <button type="button" onClick={reset} className="h-9 px-4 text-sm border border-zinc-200 rounded-sm hover:bg-zinc-50">Import another</button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "preview") {
    const newCount = preview.total - preview.duplicates;
    const confirmCount = skipDuplicates ? newCount : preview.total;
    return (
      <div className="p-6 md:p-8 max-w-4xl">
        <button type="button" onClick={() => setStep("select")} className="text-xs font-mono text-zinc-500 hover:text-black flex items-center gap-1 mb-6">
          <ArrowLeft className="w-3 h-3" /> back
        </button>
        <p className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-2">Bulk</p>
        <h1 className="text-3xl md:text-4xl font-heading font-black tracking-tight mb-2">Preview</h1>
        <p className="text-sm text-zinc-500 mb-6">{file.name}</p>

        <div className="flex gap-4 mb-5 flex-wrap">
          {[
            { label: "total rows", value: preview.total, cls: "text-zinc-900" },
            { label: "new", value: newCount, cls: "text-emerald-700" },
            { label: "duplicates", value: preview.duplicates, cls: "text-amber-700" },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-zinc-200 rounded-sm px-4 py-2 min-w-[90px]">
              <div className={`text-xl font-heading font-black ${s.cls}`}>{s.value}</div>
              <div className="text-[10px] font-mono uppercase text-zinc-500">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="bg-white border border-zinc-200 rounded-sm mb-5 overflow-hidden">
          <div className="grid grid-cols-12 px-4 py-2.5 text-[11px] font-mono uppercase tracking-widest text-zinc-500 border-b border-zinc-200">
            <div className="col-span-1">Row</div>
            <div className="col-span-6">Name</div>
            <div className="col-span-3">Fields detected</div>
            <div className="col-span-2">Status</div>
          </div>
          <div className="divide-y divide-zinc-100 max-h-96 overflow-y-auto">
            {preview.rows.map((row) => (
              <div key={row.row} className="grid grid-cols-12 px-4 py-2.5 items-center" data-testid={`preview-row-${row.row}`}>
                <div className="col-span-1 text-[11px] font-mono text-zinc-400">{row.row}</div>
                <div className="col-span-6 text-sm font-medium truncate pr-2">{row.name}</div>
                <div className="col-span-3 text-[11px] font-mono text-zinc-500">{row.fields_detected.length} field{row.fields_detected.length !== 1 ? "s" : ""}</div>
                <div className="col-span-2"><StatusChip row={row} /></div>
              </div>
            ))}
          </div>
        </div>

        {preview.duplicates > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-sm p-4 mb-5 flex items-start gap-3">
            <CircleDot className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">{preview.duplicates} duplicate{preview.duplicates !== 1 ? "s" : ""} detected</p>
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={skipDuplicates}
                  onChange={(e) => setSkipDuplicates(e.target.checked)}
                  className="w-4 h-4 rounded accent-amber-600"
                  data-testid="skip-duplicates-checkbox"
                />
                <span className="text-sm text-amber-900">Skip duplicates (import only new features)</span>
              </label>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            data-testid="import-confirm-btn"
            type="button"
            onClick={onImport}
            disabled={importing}
            className="inline-flex items-center gap-1.5 h-9 px-5 text-sm bg-black hover:bg-zinc-800 text-white rounded-sm disabled:opacity-50 transition-colors"
          >
            <Upload className="w-4 h-4" />{importing ? "Importing…" : `Import ${confirmCount} feature${confirmCount !== 1 ? "s" : ""}`}
          </button>
          <button type="button" onClick={reset} className="h-9 px-4 text-sm border border-zinc-200 rounded-sm hover:bg-zinc-50">Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl">
      <p className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-2">Bulk</p>
      <h1 className="text-3xl md:text-4xl font-heading font-black tracking-tight mb-2">Import features</h1>
      <p className="text-sm text-zinc-600 mb-6">Upload a CSV or Excel sheet to bulk-load features. You'll see a preview before anything is saved.</p>

      <div className="bg-white border border-zinc-200 rounded-sm p-6 mb-4">
        <label
          htmlFor="file-upload"
          className="block border-2 border-dashed border-zinc-300 rounded-sm p-10 text-center cursor-pointer hover:border-zinc-500 transition-colors"
          data-testid="upload-dropzone"
        >
          <FileSpreadsheet className="w-8 h-8 text-zinc-400 mx-auto mb-3" />
          {file ? (
            <div>
              <p className="text-sm font-medium">{file.name}</p>
              <p className="text-xs text-zinc-500 mt-1">{(file.size / 1024).toFixed(1)} KB — click to change</p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-medium">Drop a .csv, .xlsx or .xls file here, or click to browse</p>
              <p className="text-xs text-zinc-500 mt-1">Max 10 MB</p>
            </div>
          )}
          <input
            id="file-upload"
            type="file"
            data-testid="upload-input"
            accept=".csv,.xlsx,.xls"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="hidden"
          />
        </label>

        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={() => navigate("/features")} className="h-9 px-4 text-sm border border-zinc-200 rounded-sm hover:bg-zinc-50">Cancel</button>
          <button
            data-testid="upload-submit-btn"
            type="button"
            onClick={onPreview}
            disabled={!file || previewing}
            className="inline-flex items-center gap-1.5 h-9 px-4 text-sm bg-black hover:bg-zinc-800 text-white rounded-sm disabled:opacity-40 transition-colors"
          >
            <Upload className="w-4 h-4" />{previewing ? "Reading…" : "Preview"}
          </button>
        </div>
      </div>

      <div className="bg-zinc-50 border border-zinc-200 rounded-sm p-5">
        <h3 className="font-heading font-black text-sm tracking-tight uppercase text-zinc-500 mb-2">Expected columns (case-insensitive)</h3>
        <ul className="text-xs text-zinc-600 space-y-1 font-mono">
          <li>• name <span className="text-zinc-400">(required)</span></li>
          <li>• description, owner, tags <span className="text-zinc-400">(comma-separated)</span></li>
          <li>• test_data, test_steps, mocking_steps <span className="text-zinc-400">(free text)</span></li>
          <li>• api <span className="text-zinc-400">(cURL string or newline-delimited cURL commands)</span></li>
          <li>• mongo_collections, redis_keys, experiments <span className="text-zinc-400">(JSON array or newline-delimited)</span></li>
        </ul>
      </div>
    </div>
  );
}
