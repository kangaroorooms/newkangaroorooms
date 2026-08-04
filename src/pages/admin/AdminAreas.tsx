import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Download,
  GitMerge,
  MapPin,
  Plus,
  RefreshCw,
  Save,
  Search,
  Upload,
  X,
} from "lucide-react";
import { AdminArea, AdminAreaImportReport, adminApi } from "../../api/admin.api";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { clearLocationsCache, loadAllCities } from "../../store/slices/metadata.slice";
import { showToast } from "../../store/slices/ui.slice";

const PAGE_SIZE = 10;
const EXPECTED_HEADERS = ["city", "state", "area"];
const OPTIONAL_IMPORT_HEADERS = ["aliases", "latitude", "longitude", "popularityscore", "displayorder", "seotitle", "seodescription", "seoslug"];
const SUPPORTED_IMPORT_HEADERS = new Set([...EXPECTED_HEADERS, ...OPTIONAL_IMPORT_HEADERS]);

type CsvPreview = {
  headers: string[];
  rows: Array<{ row: number; city: string; state: string; area: string }>;
  totalRows: number;
  blankRows: number;
  incompleteRows: number;
  error: string | null;
};

type AreaUpdateInput = {
  name?: string;
  displayOrder?: number;
  isActive?: boolean;
  aliases?: string[];
  latitude?: number | null;
  longitude?: number | null;
  popularityScore?: number;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoSlug?: string | null;
};

function csvEscape(value: string | number | boolean | undefined) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function downloadCsv(filename: string, headers: string[], rows: Array<Array<string | number | boolean | undefined>>) {
  const content = [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function parseCsvPreview(content: string): CsvPreview {
  const records: string[][] = [];
  let record: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < content.length; index++) {
    const character = content[index];
    if (character === '"') {
      if (inQuotes && content[index + 1] === '"') {
        field += '"';
        index++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (!inQuotes && character === ",") {
      record.push(field);
      field = "";
      continue;
    }
    if (!inQuotes && (character === "\n" || character === "\r")) {
      if (character === "\r" && content[index + 1] === "\n") index++;
      record.push(field);
      records.push(record);
      record = [];
      field = "";
      continue;
    }
    field += character;
  }

  if (inQuotes) {
    return { headers: [], rows: [], totalRows: 0, blankRows: 0, incompleteRows: 0, error: "Malformed CSV: an opening quote is not closed." };
  }
  if (field || record.length) {
    record.push(field);
    records.push(record);
  }

  const headers = (records.shift() || []).map((header) => header.trim().toLowerCase());
  const hasValidHeaders = headers.length >= EXPECTED_HEADERS.length
    && EXPECTED_HEADERS.every((header, index) => header === headers[index])
    && headers.every((header) => SUPPORTED_IMPORT_HEADERS.has(header))
    && new Set(headers).size === headers.length;
  if (!hasValidHeaders) {
    return {
      headers,
      rows: [],
      totalRows: 0,
      blankRows: 0,
      incompleteRows: 0,
      error: "Headers must begin with city,state,area and use supported optional columns.",
    };
  }

  let blankRows = 0;
  let incompleteRows = 0;
  const rows = records.reduce<CsvPreview["rows"]>((previewRows, values, index) => {
    const [city = "", state = "", area = ""] = values.map((value) => value.trim());
    if (!city && !state && !area) {
      blankRows++;
      return previewRows;
    }
    if (!city || !state || !area) incompleteRows++;
    if (previewRows.length < 8) previewRows.push({ row: index + 2, city, state, area });
    return previewRows;
  }, []);

  return {
    headers,
    rows,
    totalRows: records.length - blankRows,
    blankRows,
    incompleteRows,
    error: null,
  };
}

export function AdminAreas() {
  const dispatch = useAppDispatch();
  const { allCities } = useAppSelector((state) => state.metadata);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [city, setCity] = useState("");
  const [areas, setAreas] = useState<AdminArea[]>([]);
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState("");
  const [mergeSource, setMergeSource] = useState("");
  const [mergeTarget, setMergeTarget] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [page, setPage] = useState(1);
  const [selectedAreaIds, setSelectedAreaIds] = useState<Set<string>>(new Set());
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<CsvPreview | null>(null);
  const [importing, setImporting] = useState(false);
  const [importReport, setImportReport] = useState<AdminAreaImportReport | null>(null);
  const [metadataAreaId, setMetadataAreaId] = useState("");

  const selectedCity = useMemo(
    () => allCities.find((item) => item.id === city || item.cityId === city),
    [allCities, city],
  );

  useEffect(() => {
    if (allCities.length === 0) dispatch(loadAllCities());
  }, [allCities.length, dispatch]);

  useEffect(() => {
    if (!city && allCities[0]) setCity(allCities[0].id);
  }, [allCities, city]);

  const loadAreas = useCallback(async () => {
    if (!city) return;
    setLoading(true);
    try {
      const data = await adminApi.getAreas({ city, includeInactive: true });
      setAreas(data);
      setSelectedAreaIds(new Set());
    } catch (error: any) {
      dispatch(showToast({ message: error.response?.data?.message || "Failed to load areas", type: "error" }));
    } finally {
      setLoading(false);
    }
  }, [city, dispatch]);

  useEffect(() => {
    void loadAreas();
  }, [loadAreas]);

  useEffect(() => {
    setPage(1);
  }, [city, search, statusFilter]);

  const filteredAreas = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return areas.filter((area) => {
      const matchesSearch = !normalizedSearch || area.name.toLowerCase().includes(normalizedSearch);
      const matchesStatus = statusFilter === "all" || (statusFilter === "active" ? area.isActive : !area.isActive);
      return matchesSearch && matchesStatus;
    });
  }, [areas, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredAreas.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageAreas = filteredAreas.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const selectedAreas = areas.filter((area) => selectedAreaIds.has(area.id));
  const metadataArea = areas.find((area) => area.id === metadataAreaId);
  const statistics = useMemo(() => ({
    total: areas.length,
    active: areas.filter((area) => area.isActive).length,
    inactive: areas.filter((area) => !area.isActive).length,
    rooms: areas.reduce((sum, area) => sum + (area.roomCount || 0), 0),
  }), [areas]);

  const createArea = async () => {
    if (!newName.trim() || !city) return;
    try {
      await adminApi.createArea({
        city,
        name: newName.trim(),
        displayOrder: areas.length ? Math.max(...areas.map((area) => area.displayOrder || 0)) + 10 : 10,
      });
      dispatch(clearLocationsCache());
      setNewName("");
      await loadAreas();
      dispatch(showToast({ message: "Area created", type: "success" }));
    } catch (error: any) {
      dispatch(showToast({ message: error.response?.data?.message || "Failed to create area", type: "error" }));
    }
  };

  const updateArea = async (area: AdminArea, patch: AreaUpdateInput) => {
    try {
      const updated = await adminApi.updateArea(area.id, patch);
      dispatch(clearLocationsCache());
      setAreas((previous) => previous.map((item) => (item.id === area.id ? { ...item, ...updated } : item)));
      dispatch(showToast({ message: "Area updated", type: "success" }));
    } catch (error: any) {
      dispatch(showToast({ message: error.response?.data?.message || "Failed to update area", type: "error" }));
    }
  };

  const moveArea = async (area: AdminArea, direction: -1 | 1) => {
    const index = areas.findIndex((item) => item.id === area.id);
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= areas.length) return;

    const next = [...areas];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    const reordered = next.map((item, orderIndex) => ({ ...item, displayOrder: (orderIndex + 1) * 10 }));
    setAreas(reordered);
    try {
      await adminApi.reorderAreas(reordered.map(({ id, displayOrder }) => ({ id, displayOrder })));
      dispatch(clearLocationsCache());
    } catch (error: any) {
      await loadAreas();
      dispatch(showToast({ message: error.response?.data?.message || "Failed to reorder areas", type: "error" }));
    }
  };

  const mergeAreas = async () => {
    if (!mergeSource || !mergeTarget || mergeSource === mergeTarget) return;
    try {
      await adminApi.mergeAreas(mergeSource, mergeTarget);
      dispatch(clearLocationsCache());
      setMergeSource("");
      setMergeTarget("");
      await loadAreas();
      dispatch(showToast({ message: "Areas merged", type: "success" }));
    } catch (error: any) {
      dispatch(showToast({ message: error.response?.data?.message || "Failed to merge areas", type: "error" }));
    }
  };

  const toggleAreaSelection = (areaId: string) => {
    setSelectedAreaIds((previous) => {
      const next = new Set(previous);
      if (next.has(areaId)) next.delete(areaId);
      else next.add(areaId);
      return next;
    });
  };

  const togglePageSelection = () => {
    const everyPageAreaSelected = pageAreas.length > 0 && pageAreas.every((area) => selectedAreaIds.has(area.id));
    setSelectedAreaIds((previous) => {
      const next = new Set(previous);
      pageAreas.forEach((area) => everyPageAreaSelected ? next.delete(area.id) : next.add(area.id));
      return next;
    });
  };

  const runBulkStatusUpdate = async (isActive: boolean) => {
    const targets = selectedAreas.filter((area) => area.isActive !== isActive);
    if (!targets.length) return;
    const action = isActive ? "activate" : "deactivate";
    if (!window.confirm(`${action[0].toUpperCase()}${action.slice(1)} ${targets.length} selected area${targets.length === 1 ? "" : "s"}?`)) return;

    setBulkUpdating(true);
    try {
      await Promise.all(targets.map((area) => adminApi.updateArea(area.id, { isActive })));
      dispatch(clearLocationsCache());
      await loadAreas();
      dispatch(showToast({ message: `${targets.length} area${targets.length === 1 ? "" : "s"} ${isActive ? "activated" : "deactivated"}`, type: "success" }));
    } catch (error: any) {
      await loadAreas();
      dispatch(showToast({ message: error.response?.data?.message || `Failed to ${action} selected areas`, type: "error" }));
    } finally {
      setBulkUpdating(false);
    }
  };

  const exportAreas = (areasToExport: AdminArea[], filename = "areas.csv") => {
    downloadCsv(filename, ["city", "area", "aliases", "latitude", "longitude", "popularityScore", "seoTitle", "seoDescription", "seoSlug", "status", "displayOrder", "roomCount"], areasToExport.map((area) => [
      selectedCity?.name || area.city || "",
      area.name,
      (area.aliases || []).map((alias) => alias.name).join(" | "),
      area.latitude ?? "",
      area.longitude ?? "",
      area.popularityScore || 0,
      area.seoTitle || "",
      area.seoDescription || "",
      area.seoSlug || "",
      area.isActive ? "active" : "inactive",
      area.displayOrder,
      area.roomCount || 0,
    ]));
  };

  const saveAreaMetadata = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!metadataArea) return;
    const formData = new FormData(event.currentTarget);
    const optionalNumber = (field: string) => {
      const value = String(formData.get(field) || "").trim();
      return value ? Number(value) : null;
    };
    const aliases = String(formData.get("aliases") || "")
      .split(/[|;]/g)
      .map((alias) => alias.trim())
      .filter(Boolean);

    await updateArea(metadataArea, {
      aliases,
      latitude: optionalNumber("latitude"),
      longitude: optionalNumber("longitude"),
      popularityScore: optionalNumber("popularityScore") ?? 0,
      seoTitle: String(formData.get("seoTitle") || "").trim() || null,
      seoDescription: String(formData.get("seoDescription") || "").trim() || null,
      seoSlug: String(formData.get("seoSlug") || "").trim() || null,
    });
  };

  const selectImportFile = async (file: File | null) => {
    setImportReport(null);
    setSelectedFile(file);
    if (!file) {
      setCsvPreview(null);
      return;
    }
    try {
      setCsvPreview(parseCsvPreview(await file.text()));
    } catch {
      setCsvPreview({ headers: [], rows: [], totalRows: 0, blankRows: 0, incompleteRows: 0, error: "Could not read this CSV file." });
    }
  };

  const importAreas = async () => {
    if (!selectedFile || !csvPreview || csvPreview.error) return;
    if (!window.confirm(`Import ${selectedFile.name}? The server will validate all rows and skip duplicates.`)) return;

    setImporting(true);
    try {
      const report = await adminApi.importAreas(selectedFile);
      setImportReport(report);
      dispatch(clearLocationsCache());
      await Promise.all([dispatch(loadAllCities()), loadAreas()]);
      dispatch(showToast({ message: `${report.rowsInserted} areas imported`, type: "success" }));
    } catch (error: any) {
      dispatch(showToast({ message: error.response?.data?.message || "Failed to import CSV", type: "error" }));
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream pt-20 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="font-playfair text-2xl font-bold text-navy dark:text-white md:text-3xl">Area Management</h1>
            <p className="mt-1 text-sm text-slate-500">Manage city areas, availability, imports, and exports.</p>
          </div>
          <button type="button" onClick={loadAreas} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>

        <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Total areas", statistics.total],
            ["Active", statistics.active],
            ["Inactive", statistics.inactive],
            ["Rooms mapped", statistics.rooms],
          ].map(([label, value]) => <div key={String(label)} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><div className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</div><div className="mt-1 flex items-center gap-2 text-2xl font-bold text-navy dark:text-white"><BarChart3 className="h-4 w-4 text-slate-400" />{value}</div></div>)}
        </div>

        <div className="mb-5 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 md:grid-cols-[1fr_1fr_auto]">
          <div><label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">City</label><select value={city} onChange={(event) => setCity(event.target.value)} className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white">{allCities.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
          <div><label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">New Area</label><input value={newName} onChange={(event) => setNewName(event.target.value)} placeholder={`Add area in ${selectedCity?.name || "city"}`} className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></div>
          <button type="button" onClick={createArea} disabled={!newName.trim() || !city} className="inline-flex h-11 items-center justify-center gap-2 self-end rounded-lg bg-navy px-4 text-sm font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-navy"><Plus className="h-4 w-4" />Create</button>
        </div>

        <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h2 className="font-semibold text-slate-800 dark:text-white">Bulk CSV import</h2><p className="text-sm text-slate-500">Preview is advisory; the server validates every row and checks database duplicates.</p></div><div className="flex gap-2"><input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => void selectImportFile(event.target.files?.[0] || null)} /><button type="button" onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"><Upload className="h-4 w-4" />CSV Import</button>{selectedFile && <button type="button" onClick={() => void selectImportFile(null)} className="rounded-lg p-2 text-slate-500"><X className="h-4 w-4" /></button>}</div></div>
          {selectedFile && csvPreview && <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950"><div className="flex flex-col justify-between gap-3 sm:flex-row"><div><p className="font-medium text-slate-800 dark:text-white">{selectedFile.name}</p><p className="text-sm text-slate-500">{csvPreview.totalRows} non-blank rows · {csvPreview.blankRows} blank ignored · {csvPreview.incompleteRows} incomplete</p></div><button type="button" onClick={importAreas} disabled={!!csvPreview.error || importing} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-navy px-4 text-sm font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-navy"><Upload className="h-4 w-4" />{importing ? "Importing…" : "Confirm import"}</button></div>{csvPreview.error ? <p className="mt-3 text-sm font-medium text-red-600">{csvPreview.error}</p> : <div className="mt-3 overflow-x-auto"><p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Preview: first {csvPreview.rows.length} rows</p><table className="min-w-full text-left text-sm"><thead className="text-xs uppercase text-slate-500"><tr><th className="pr-4">Row</th><th className="pr-4">City</th><th className="pr-4">State</th><th>Area</th></tr></thead><tbody>{csvPreview.rows.map((row) => <tr key={row.row} className="border-t border-slate-200 dark:border-slate-800"><td className="py-2 pr-4">{row.row}</td><td className="py-2 pr-4">{row.city}</td><td className="py-2 pr-4">{row.state}</td><td className="py-2">{row.area}</td></tr>)}</tbody></table></div>}</div>}
          {importReport && <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-950 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-100"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold">Import complete</p><p>{importReport.rowsInserted} inserted · {importReport.citiesCreated} cities created · {importReport.failedRows} failed</p><p className="mt-1">Duplicates: {importReport.duplicateInCsv} in CSV · {importReport.duplicateInDatabase} already in database</p></div>{importReport.errors.length > 0 && <button type="button" onClick={() => downloadCsv("area-import-failed-rows.csv", ["row", "reason"], importReport.errors.map((error) => [error.row, error.reason]))} className="inline-flex items-center gap-2 rounded-lg border border-green-300 px-3 py-2 font-semibold"><Download className="h-4 w-4" />Download failed rows</button>}</div></div>}
        </div>

        <div className="mb-5 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 md:grid-cols-[1fr_1fr_auto]">
          <select value={mergeSource} onChange={(event) => setMergeSource(event.target.value)} className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"><option value="">Duplicate area</option>{areas.map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}</select>
          <select value={mergeTarget} onChange={(event) => setMergeTarget(event.target.value)} className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"><option value="">Merge into</option>{areas.filter((area) => area.id !== mergeSource && area.isActive).map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}</select>
          <button type="button" onClick={mergeAreas} disabled={!mergeSource || !mergeTarget} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200"><GitMerge className="h-4 w-4" />Merge</button>
        </div>

        <div key={metadataAreaId || "metadata"} className="mb-5 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3"><h2 className="font-semibold text-slate-800 dark:text-white">Area metadata</h2><p className="text-sm text-slate-500">Canonical name is the area name. Aliases use <code>|</code> or <code>;</code> separators.</p></div>
          <select value={metadataAreaId} onChange={(event) => setMetadataAreaId(event.target.value)} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"><option value="">Select an area to edit metadata</option>{areas.map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}</select>
          {metadataArea && <form onSubmit={(event) => void saveAreaMetadata(event)} className="mt-3 grid gap-3 md:grid-cols-2"><label className="text-sm text-slate-600 dark:text-slate-300">Aliases<input name="aliases" defaultValue={(metadataArea.aliases || []).map((alias) => alias.name).join(" | ")} className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label><label className="text-sm text-slate-600 dark:text-slate-300">Popularity score<input name="popularityScore" type="number" min="0" step="1" defaultValue={metadataArea.popularityScore || 0} className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label><label className="text-sm text-slate-600 dark:text-slate-300">Latitude<input name="latitude" type="number" min="-90" max="90" step="any" defaultValue={metadataArea.latitude ?? ""} className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label><label className="text-sm text-slate-600 dark:text-slate-300">Longitude<input name="longitude" type="number" min="-180" max="180" step="any" defaultValue={metadataArea.longitude ?? ""} className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label><label className="text-sm text-slate-600 dark:text-slate-300">SEO title<input name="seoTitle" defaultValue={metadataArea.seoTitle || ""} className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label><label className="text-sm text-slate-600 dark:text-slate-300">SEO slug<input name="seoSlug" defaultValue={metadataArea.seoSlug || ""} className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label><label className="md:col-span-2 text-sm text-slate-600 dark:text-slate-300">SEO description<textarea name="seoDescription" defaultValue={metadataArea.seoDescription || ""} maxLength={500} className="mt-1 min-h-20 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label><button type="submit" className="inline-flex w-fit items-center gap-2 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-navy"><Save className="h-4 w-4" />Save metadata</button></form>}
        </div>

        <div className="mb-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 md:flex-row md:items-center md:justify-between"><div className="flex flex-1 flex-col gap-3 sm:flex-row"><label className="relative block flex-1"><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search areas" className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "all" | "active" | "inactive")} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"><option value="all">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select></div><button type="button" onClick={() => exportAreas(selectedAreas.length ? selectedAreas : filteredAreas, selectedAreas.length ? "selected-areas.csv" : "areas.csv")} disabled={!filteredAreas.length} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200"><Download className="h-4 w-4" />Export {selectedAreas.length ? "selection" : "CSV"}</button></div>

        {selectedAreas.length > 0 && <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-navy/20 bg-navy/5 p-3 text-sm dark:border-white/20 dark:bg-white/5"><CheckSquare className="h-4 w-4" /><span className="font-semibold">{selectedAreas.length} selected</span><button type="button" disabled={bulkUpdating} onClick={() => void runBulkStatusUpdate(true)} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">Activate</button><button type="button" disabled={bulkUpdating} onClick={() => void runBulkStatusUpdate(false)} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">Deactivate</button><button type="button" onClick={() => setSelectedAreaIds(new Set())} className="ml-auto text-slate-600 underline dark:text-slate-300">Clear</button></div>}

        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"><div className="grid min-w-[760px] grid-cols-[36px_72px_1fr_100px_110px_150px] border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-950"><span><input aria-label="Select all areas on this page" type="checkbox" checked={pageAreas.length > 0 && pageAreas.every((area) => selectedAreaIds.has(area.id))} onChange={togglePageSelection} /></span><span>Order</span><span>Area</span><span>Rooms</span><span>Status</span><span>Actions</span></div>
          {pageAreas.map((area) => { const fullIndex = areas.findIndex((item) => item.id === area.id); return <div key={area.id} className="grid min-w-[760px] grid-cols-[36px_72px_1fr_100px_110px_150px] items-center gap-2 border-b border-slate-100 px-4 py-3 last:border-b-0 dark:border-slate-800"><input aria-label={`Select ${area.name}`} type="checkbox" checked={selectedAreaIds.has(area.id)} onChange={() => toggleAreaSelection(area.id)} /><div className="flex items-center gap-1"><button type="button" onClick={() => void moveArea(area, -1)} disabled={fullIndex === 0} className="rounded p-1 disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button><button type="button" onClick={() => void moveArea(area, 1)} disabled={fullIndex === areas.length - 1} className="rounded p-1 disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button></div><div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-slate-400" /><input value={area.name} onChange={(event) => setAreas((previous) => previous.map((item) => item.id === area.id ? { ...item, name: event.target.value } : item))} className="h-9 w-full rounded border border-transparent bg-transparent px-2 text-sm font-medium text-slate-800 hover:border-slate-200 focus:border-slate-300 focus:bg-white dark:text-slate-100 dark:focus:bg-slate-950" /></div><span className="text-sm text-slate-500">{area.roomCount || 0}</span><button type="button" onClick={() => void updateArea(area, { isActive: !area.isActive })} className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${area.isActive ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`}>{area.isActive ? "Active" : "Disabled"}</button><button type="button" onClick={() => void updateArea(area, { name: area.name, displayOrder: area.displayOrder })} className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"><Save className="h-3.5 w-3.5" />Save</button></div>; })}
          {!loading && pageAreas.length === 0 && <div className="p-10 text-center text-sm text-slate-500">No areas match the current filters.</div>}
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-slate-600 dark:text-slate-300"><span>{filteredAreas.length ? `${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, filteredAreas.length)} of ${filteredAreas.length}` : "0 areas"}</span><div className="flex items-center gap-2"><button type="button" aria-label="Previous page" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={currentPage === 1} className="rounded-lg border border-slate-200 p-2 disabled:opacity-40 dark:border-slate-700"><ChevronLeft className="h-4 w-4" /></button><span>Page {currentPage} of {totalPages}</span><button type="button" aria-label="Next page" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={currentPage === totalPages} className="rounded-lg border border-slate-200 p-2 disabled:opacity-40 dark:border-slate-700"><ChevronRight className="h-4 w-4" /></button></div></div>
      </div>
    </div>
  );
}
