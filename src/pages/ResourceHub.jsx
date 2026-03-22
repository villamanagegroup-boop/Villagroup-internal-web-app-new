import { useState, useRef } from 'react'
import { Upload, File, FileText, FileImage, Trash2, Download, Search, Loader2, BookOpen } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { useDocuments } from '../hooks/useDocuments'
import SlidePanel from '../components/ui/SlidePanel'

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'template', label: 'Templates' },
  { key: 'sop', label: 'SOPs' },
  { key: 'agreement', label: 'Agreements' },
  { key: 'checklist', label: 'Checklists' },
  { key: 'general', label: 'General' },
]

const CAT_COLORS = {
  template: 'bg-blue-50 text-blue-700',
  sop: 'bg-purple-50 text-purple-700',
  agreement: 'bg-amber-50 text-amber-700',
  checklist: 'bg-green-50 text-green-700',
  general: 'bg-gray-100 text-gray-600',
}

const CAT_LABELS = {
  template: 'Template',
  sop: 'SOP',
  agreement: 'Agreement',
  checklist: 'Checklist',
  general: 'General',
}

function fileIcon(type, size = 18) {
  if (!type) return <File size={size} className="text-gray-400 shrink-0" />
  if (type.includes('pdf')) return <FileText size={size} className="text-red-500 shrink-0" />
  if (type.includes('image')) return <FileImage size={size} className="text-blue-400 shrink-0" />
  if (type.includes('word') || type.includes('document')) return <FileText size={size} className="text-blue-500 shrink-0" />
  if (type.includes('sheet') || type.includes('excel')) return <FileText size={size} className="text-green-500 shrink-0" />
  return <File size={size} className="text-gray-400 shrink-0" />
}

function formatSize(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`
}

function formatDate(d) {
  try { return format(parseISO(d), 'MMM d, yyyy') } catch { return '—' }
}

export default function ResourceHub() {
  const { documents, loading, uploadDocument, deleteDocument } = useDocuments('resource_hub')
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')
  const [panelOpen, setPanelOpen] = useState(false)
  const [file, setFile] = useState(null)
  const [name, setName] = useState('')
  const [category, setCategory] = useState('general')
  const [description, setDescription] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const fileRef = useRef()

  const filtered = documents.filter(d => {
    const matchCat = activeTab === 'all' || d.category === activeTab
    const q = search.toLowerCase()
    const matchSearch = !q ||
      d.name.toLowerCase().includes(q) ||
      (d.description || '').toLowerCase().includes(q) ||
      (CAT_LABELS[d.category] || '').toLowerCase().includes(q)
    return matchCat && matchSearch
  })

  function openPanel() {
    setFile(null)
    setName('')
    setCategory('general')
    setDescription('')
    setUploadError(null)
    setPanelOpen(true)
  }

  function handleFileChange(e) {
    const f = e.target.files[0]
    if (!f) return
    setFile(f)
    if (!name) setName(f.name.replace(/\.[^.]+$/, ''))
  }

  async function handleUpload() {
    if (!file || !name.trim()) return
    setUploading(true)
    setUploadError(null)
    const result = await uploadDocument(file, { name: name.trim(), category, description })
    setUploading(false)
    if (result.success) {
      setPanelOpen(false)
    } else {
      setUploadError(result.error)
    }
  }

  async function handleDelete(doc) {
    if (!confirm(`Delete "${doc.name}"?`)) return
    setDeleting(doc.id)
    await deleteDocument(doc)
    setDeleting(null)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Page Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 shrink-0">
        <div>
          <h1 className="font-display text-xl font-semibold text-navy">Resource Hub</h1>
          <p className="text-xs text-gray-400 mt-0.5">Team docs, SOPs, templates & agreements — all in one place</p>
        </div>
        <button
          onClick={openPanel}
          className="flex items-center gap-2 px-4 py-2 bg-navy text-white rounded-xl text-sm font-medium hover:bg-navy/90 transition-colors"
        >
          <Upload size={15} /> Upload Document
        </button>
      </div>

      {/* Filter + Search bar */}
      <div className="flex items-center gap-3 px-6 py-3 bg-white border-b border-gray-100 shrink-0">
        <div className="flex gap-1 flex-1 flex-wrap">
          {CATEGORIES.map(c => (
            <button
              key={c.key}
              onClick={() => setActiveTab(c.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                activeTab === c.key
                  ? 'bg-navy text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {c.label}
              {c.key !== 'all' && (
                <span className="ml-1 opacity-60">
                  ({documents.filter(d => d.category === c.key).length})
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="relative shrink-0">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy/30 w-44"
          />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-gray-300" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <BookOpen size={44} className="text-gray-200 mb-3" />
            <p className="text-sm font-medium text-gray-400">
              {search ? 'No documents match your search.' : 'Nothing here yet.'}
            </p>
            {!search && (
              <button onClick={openPanel} className="mt-2 text-sm text-navy underline">
                Upload the first document
              </button>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="text-left text-xs text-gray-400 font-medium px-6 py-3">Name</th>
                <th className="text-left text-xs text-gray-400 font-medium px-4 py-3 w-28">Category</th>
                <th className="text-left text-xs text-gray-400 font-medium px-4 py-3 hidden md:table-cell">Description</th>
                <th className="text-left text-xs text-gray-400 font-medium px-4 py-3 w-20 hidden lg:table-cell">Size</th>
                <th className="text-left text-xs text-gray-400 font-medium px-4 py-3 w-28 hidden lg:table-cell">Uploaded</th>
                <th className="w-20 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map(doc => (
                <tr key={doc.id} className="border-b border-gray-50 hover:bg-gray-50/60 group">
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      {fileIcon(doc.file_type)}
                      <span className="text-sm font-medium text-gray-800">{doc.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${CAT_COLORS[doc.category] || CAT_COLORS.general}`}>
                      {CAT_LABELS[doc.category] || doc.category}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    <span className="text-sm text-gray-400 truncate max-w-xs block">
                      {doc.description || <span className="text-gray-300">—</span>}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 hidden lg:table-cell">
                    <span className="text-sm text-gray-400">{formatSize(doc.file_size)}</span>
                  </td>
                  <td className="px-4 py-3.5 hidden lg:table-cell">
                    <span className="text-sm text-gray-400">{formatDate(doc.created_at)}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-navy transition-colors"
                        title="Download / Open"
                      >
                        <Download size={14} />
                      </a>
                      <button
                        onClick={() => handleDelete(doc)}
                        disabled={deleting === doc.id}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                        {deleting === doc.id
                          ? <Loader2 size={14} className="animate-spin" />
                          : <Trash2 size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Upload Slide Panel */}
      {panelOpen && (
        <SlidePanel
          title="Upload to Resource Hub"
          subtitle="Add a document, template, SOP, or agreement"
          onClose={() => setPanelOpen(false)}
          footer={
            <div className="flex gap-2">
              <button
                onClick={handleUpload}
                disabled={!file || !name.trim() || uploading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-navy text-white rounded-xl text-sm font-medium disabled:opacity-50"
              >
                {uploading
                  ? <><Loader2 size={14} className="animate-spin" /> Uploading...</>
                  : <><Upload size={14} /> Upload</>}
              </button>
              <button
                onClick={() => setPanelOpen(false)}
                className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          }
        >
          <input type="file" ref={fileRef} className="hidden" onChange={handleFileChange} />

          {/* Drop zone */}
          <div
            onClick={() => fileRef.current.click()}
            className="flex flex-col items-center justify-center gap-2 py-10 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:border-navy/40 hover:bg-gray-50/60 transition-all"
          >
            {file ? (
              <>
                {fileIcon(file.type, 22)}
                <p className="text-sm font-medium text-gray-700 text-center mt-1">{file.name}</p>
                <p className="text-xs text-gray-400">{formatSize(file.size)} · Click to change</p>
              </>
            ) : (
              <>
                <Upload size={24} className="text-gray-300" />
                <p className="text-sm font-medium text-gray-500">Click to select a file</p>
                <p className="text-xs text-gray-400">PDF, Word, Excel, images, and more</p>
              </>
            )}
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Document Name *</label>
            <input
              type="text"
              placeholder="e.g. Move-In Checklist Template"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-navy/30"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-navy/30"
            >
              <option value="template">Template</option>
              <option value="sop">SOP</option>
              <option value="agreement">Agreement</option>
              <option value="checklist">Checklist</option>
              <option value="general">General</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Description <span className="text-gray-400 font-normal">(optional)</span></label>
            <textarea
              placeholder="Brief description of what this document is for..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-navy/30"
            />
          </div>

          {uploadError && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{uploadError}</p>
          )}
        </SlidePanel>
      )}
    </div>
  )
}
