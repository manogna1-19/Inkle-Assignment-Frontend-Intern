import React, { useEffect, useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import axios from "axios";


const TAXES_API = "https://685013d7e7c42cfd17974a33.mockapi.io/taxes";
const COUNTRIES_API = "https://685013d7e7c42cfd17974a33.mockapi.io/countries";

const columnHelper = createColumnHelper();

export default function App() {
  const [data, setData] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [editingRow, setEditingRow] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", country: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [taxRes, countryRes] = await Promise.all([
          axios.get(TAXES_API),
          axios.get(COUNTRIES_API),
        ]);

        setData(taxRes.data);
        setCountries(countryRes.data);
      } catch (err) {
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const columns = useMemo(
    () => [
      columnHelper.accessor("id", {
        header: "ID",
        cell: (info) => info.getValue(),
        size: 60,
      }),
      columnHelper.accessor("name", {
        header: "Name",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("tax", {
        header: "Tax",
        cell: (info) => `${info.getValue()}%`,
      }),
      columnHelper.accessor("country", {
        header: "Country",
        cell: (info) => info.getValue(),
      }),
      columnHelper.display({
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <button
            className="p-2 rounded hover:bg-gray-200"
            onClick={() => openEditModal(row.original)}
          >
            ✏️
          </button>
        ),
      }),
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  function openEditModal(row) {
    setEditingRow(row);
    setForm({ name: row.name, country: row.country });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingRow(null);
  }

  async function saveChanges() {
    setSaving(true);

    const payload = {
      ...editingRow,
      name: form.name,
      country: form.country,
    };

    try {
      const res = await axios.put(`${TAXES_API}/${editingRow.id}`, payload);
      const newData = data.map((item) =>
        item.id === editingRow.id ? res.data : item
      );
      setData(newData);
      closeModal();
    } catch (error) {
      alert("Failed to update");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-10">Loading...</div>;
  if (error) return <div className="p-10 text-red-500">{error}</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Taxes Table</h1>

      <div className="overflow-x-auto border rounded-lg shadow">
        <table className="w-full border-collapse">
          <thead className="bg-gray-100">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th key={header.id} className="p-3 text-left text-gray-700">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-t hover:bg-gray-50">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="p-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-lg font-semibold mb-4">Edit Entry</h2>

            <label className="block mb-2 text-sm">Name</label>
            <input
              className="w-full border rounded p-2 mb-4"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />

            <label className="block mb-2 text-sm">Country</label>
            <select
              className="w-full border rounded p-2 mb-4"
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
            >
              <option>Select a country</option>
              {countries.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>

            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 border rounded"
                onClick={closeModal}
              >
                Cancel
              </button>

              <button
                className={`px-4 py-2 text-white rounded ${
                  saving ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
                }`}
                onClick={saveChanges}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
