import { useState, useRef } from 'react'
import { Upload, File, FileText, FileImage, Trash2, Download, Plus, Loader2 } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { useDocuments } from '../../hooks/useDocuments'

function fileIcon(type) {
  if (!type) return <File size={15} className="text-gray-400 shrink-0" />
  if (type.includes('pdf')) return <FileText size={15} className="text-red-400 shrink-0" />
  if (type.includes('image')) return <FileImage size={15} className="text-blue-400 shrink-0" />
  if (type.includes('word') || type.includes('document')) return <FileText size={15} className="text-blue-500 shrink-0" />
  if (type.includes('sheet') || type.includes('excel')) return <FileText size={15} className="text-green-500 shrink-0" />
  return <File size={15} className="text-gray-400 shrink-0" />
}

function formatSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`
}

export default function DocumentsSection({ entityType, entityId }) {
  const { documents, loading, uploadDocument, deleteDocument } = useDocuments(entityType, entityId)
  const [showForm, setShowForm] = useState(false)
  const [file, setFile] = useState(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const fileRef = useRef()

  function handleFileChange(e) {
    const f = e.target.files[0]
    if (!f) return
    setFile(f)
    if (!name) setName(f.name.replace(/\.[^.]+$/, ''))
  }

  async function handleUpload() {
    if (!file) return
    setUploading(true)
    setUploadError(null)
    const result = await uploadDocument(file, { name: name || file.name, description })
    setUploading(false)
    if (result.success) {
      setFile(null)
      setName('')
      setDescription('')
      setShowForm(false)
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
    <div>
      <input type="file" ref={fileRef} className="hidden" onChange={handleFileChange} />

      {showForm ? (
        <div className="mb-4 p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
          <div
            onClick={() => fileRef.current.click()}
            className="flex flex-col items-center justify-center gap-1.5 py-5 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-navy/40 transition-colors"
          >
            {file ? (
              <>
                {fileIcon(file.type)}
                <p className="text-sm font-medium text-gray-700">{file.name}</p>
                <p className="text-xs text-gray-400">{formatSize(file.size)} · Click to change</p>
              </>
            ) : (
              <>
                <Upload size={18} className="text-gray-400" />
                <p className="text-sm text-gray-500">Click to choose a file</p>
              </>
            )}
          </div>
          <input
            type="text"
            placeholder="Document name"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy/30"
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy/30"
          />
          {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="flex-1 flex items-center justify-center gap-2 py-2 bg-navy text-white rounded-xl text-sm font-medium disabled:opacity-50"
            >
              {uploading
                ? <><Loader2 size={13} className="animate-spin" /> Uploading...</>
                : <><Upload size={13} /> Upload</>}
            </button>
            <button
              onClick={() => { setShowForm(false); setFile(null); setName(''); setDescription(''); setUploadError(null) }}
              className="px-4 py-2 bg-gray-200 text-gray-600 rounded-xl text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 text-sm text-navy font-medium mb-3 hover:opacity-75 transition-opacity"
        >
          <Plus size={14} /> Upload Document
        </button>
      )}

      {loading ? (
        <p className="text-sm text-gray-400 text-center py-2">Loading...</p>
      ) : documents.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-3 italic">No documents uploaded yet.</p>
      ) : (
        <div className="space-y-0.5">
          {documents.map(doc => (
            <div key={doc.id} className="flex items-center gap-3 py-2.5 px-2 rounded-xl hover:bg-gray-50 group">
              {fileIcon(doc.file_type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">{doc.name}</p>
                {doc.description && (
                  <p className="text-xs text-gray-400 truncate">{doc.description}</p>
                )}
                <p className="text-[11px] text-gray-300">
                  {formatSize(doc.file_size)}
                  {doc.created_at ? ` · ${format(parseISO(doc.created_at), 'MMM d, yyyy')}` : ''}
                </p>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <a
                  href={doc.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-navy transition-colors"
                  title="Download"
                >
                  <Download size={13} />
                </a>
                <button
                  onClick={() => handleDelete(doc)}
                  disabled={deleting === doc.id}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                  title="Delete"
                >
                  {deleting === doc.id
                    ? <Loader2 size={13} className="animate-spin" />
                    : <Trash2 size={13} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
