import { useState, useRef } from 'react'
import { Camera, X, ChevronLeft, ChevronRight, Upload } from 'lucide-react'

export default function PhotoGallery({ photos, onUpload, onDelete }) {
  const [lightbox, setLightbox] = useState(null) // index
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef()

  async function handleFileChange(e) {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setUploading(true)
    for (const file of files) {
      await onUpload(file)
    }
    setUploading(false)
    e.target.value = ''
  }

  const sorted = [...photos].sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div>
      {/* Grid */}
      {sorted.length > 0 ? (
        <div className="grid grid-cols-3 gap-2 mb-3">
          {sorted.map((photo, i) => (
            <div key={photo.id} className="relative aspect-square group">
              <img
                src={photo.url}
                alt={photo.caption || `Photo ${i + 1}`}
                className="w-full h-full object-cover rounded-xl cursor-pointer"
                onClick={() => setLightbox(i)}
              />
              <button
                onClick={() => onDelete(photo.id, photo.url)}
                className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-gray-400 mb-3">
          <Camera size={28} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">No photos yet</p>
        </div>
      )}

      {/* Upload button */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
      <button
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-navy/40 hover:text-navy transition-colors disabled:opacity-50"
      >
        <Upload size={15} />
        {uploading ? 'Uploading...' : 'Add Photos'}
      </button>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 rounded-full p-2"
            onClick={e => { e.stopPropagation(); setLightbox(i => Math.max(0, i - 1)) }}
          >
            <ChevronLeft size={24} className="text-white" />
          </button>
          <img
            src={sorted[lightbox]?.url}
            alt=""
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={e => e.stopPropagation()}
          />
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 rounded-full p-2"
            onClick={e => { e.stopPropagation(); setLightbox(i => Math.min(sorted.length - 1, i + 1)) }}
          >
            <ChevronRight size={24} className="text-white" />
          </button>
          <button
            className="absolute top-4 right-4 bg-white/20 rounded-full p-2"
            onClick={() => setLightbox(null)}
          >
            <X size={20} className="text-white" />
          </button>
          <p className="absolute bottom-4 text-white/60 text-sm">{lightbox + 1} / {sorted.length}</p>
        </div>
      )}
    </div>
  )
}
