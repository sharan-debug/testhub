import { useState, useRef } from "react";
import { api } from "../lib/api";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function ImportPage() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const fileRef = useRef(null);
  const navigate = useNavigate();

  const onUpload = async () => {
    if (!file) { toast.error("Please choose a file"); return; }
    setUploading(true);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await api.post("/features/import", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setResult(r.data);
      if (r.data.imported > 0) toast.success(`Imported ${r.data.imported} features`);
    } catch (e) {
      toast.error("Import failed: " + (e?.response?.data?.detail || e.message));
    }
    setUploading(false);
  };

  return (
    <div className="p-6 md:p-8 max-w-3xl">
      <p className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-2">Bulk</p>
      <h1 className="text-3xl md:text-4xl font-heading font-black tracking-tight mb-2">Import features</h1>
      <p className="text-sm text-zinc-600 mb-6">Upload a CSV or Excel sheet to bulk-load features from your existing test data.</p>

      <div className="bg-white border border-zinc-200 rounded-sm p-6 mb-4">
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-zinc-300 rounded-sm p-10 text-center cursor-pointer hover:border-zinc-500 transition-colors"
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
            ref={fileRef}
            type="file"
            data-testid="upload-input"
            accept=".csv,.xlsx,.xls"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="hidden"
          />
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={() => navigate("/features")} className="h-9 px-4 text-sm border border-zinc-200 rounded-sm hover:bg-zinc-50">Cancel</button>
          <button
            data-testid="upload-submit-btn"
            onClick={onUpload}
            disabled={!file || uploading}
            className="inline-flex items-center gap-1.5 h-9 px-4 text-sm bg-black hover:bg-zinc-800 text-white rounded-sm disabled:opacity-40 transition-colors"
          >
            <Upload className="w-4 h-4" />{uploading ? "Uploading…" : "Import"}
          </button>
        </div>
      </div>

      {result && (
        <div className="bg-white border border-zinc-200 rounded-sm p-5" data-testid="import-result">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <p className="font-medium text-sm">Imported {result.imported} features</p>
          </div>
          {result.errors?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <p className="font-medium text-sm">{result.errors.length} row error(s)</p>
              </div>
              <pre className="text-xs bg-zinc-50 border border-zinc-100 rounded-sm p-3 font-mono max-h-48 overflow-auto">{result.errors.join("\n")}</pre>
            </div>
          )}
          <button
            data-testid="import-view-features"
            onClick={() => navigate("/features")}
            className="h-9 px-4 text-sm border border-zinc-200 rounded-sm hover:bg-zinc-50 mt-4"
          >View features</button>
        </div>
      )}

      <div className="mt-8 bg-zinc-50 border border-zinc-200 rounded-sm p-5">
        <h3 className="font-heading font-black text-sm tracking-tight uppercase text-zinc-500 mb-2">Expected columns (case-insensitive)</h3>
        <ul className="text-xs text-zinc-600 space-y-1 font-mono">
          <li>• name <span className="text-zinc-400">(required)</span></li>
          <li>• description, owner, tags <span className="text-zinc-400">(comma-separated)</span></li>
          <li>• test_data, test_steps, mocking_steps <span className="text-zinc-400">(free text)</span></li>
          <li>• apis <span className="text-zinc-400">(JSON array or `METHOD /path` per line)</span></li>
          <li>• mongo_collections, redis_keys, experiments <span className="text-zinc-400">(JSON array or newline-delimited)</span></li>
        </ul>
      </div>
    </div>
  );
}
