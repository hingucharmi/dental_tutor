'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import apiClient from '@/lib/utils/apiClient';

export default function ImagesPage() {
  const { user, loading: authLoading } = useAuth(true);
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    imageType: 'other',
    description: '',
    appointmentId: '',
  });
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    if (!authLoading && user) {
      fetchImages();
    }
  }, [authLoading, user, filterType]);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const url = filterType !== 'all'
        ? `/api/images?type=${filterType}`
        : '/api/images';
      const response = await apiClient.get(url);
      if (response.data.success) {
        setImages(response.data.data.images || []);
      }
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('Please select a file');
      return;
    }

    try {
      setUploading(true);
      
      // In a real app, you would upload to a file storage service first
      // For now, we'll create a mock file path
      const filePath = `/uploads/images/${user?.id}/${Date.now()}_${selectedFile.name}`;
      const thumbnailPath = `/uploads/images/${user?.id}/thumbnails/${Date.now()}_${selectedFile.name}`;
      
      const payload: any = {
        imageType: formData.imageType,
        fileName: selectedFile.name,
        filePath: filePath,
        fileSize: selectedFile.size,
        mimeType: selectedFile.type,
        thumbnailPath: thumbnailPath,
      };
      
      if (formData.description) payload.description = formData.description;
      if (formData.appointmentId) payload.appointmentId = parseInt(formData.appointmentId);

      const response = await apiClient.post('/api/images', payload);
      if (response.data.success) {
        setShowUploadForm(false);
        setSelectedFile(null);
        setFormData({
          imageType: 'other',
          description: '',
          appointmentId: '',
        });
        fetchImages();
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getImageTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      symptom: 'Symptom',
      xray: 'X-Ray',
      before_after: 'Before/After',
      other: 'Other',
    };
    return labels[type] || type;
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-secondary-600">Loading images...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-responsive font-bold text-primary-700">
            Patient Images
          </h1>
          <p className="text-secondary-600 mt-2">
            Upload and manage your dental images
          </p>
        </div>
        <button
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          {showUploadForm ? 'Cancel' : 'Upload Image'}
        </button>
      </div>

      {showUploadForm && (
        <div className="bg-white rounded-lg shadow-md p-6 border border-secondary-200">
          <h2 className="text-xl font-semibold text-primary-700 mb-4">
            Upload Image
          </h2>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Image Type *
              </label>
              <select
                required
                value={formData.imageType}
                onChange={(e) => setFormData({ ...formData, imageType: e.target.value })}
                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="symptom">Symptom</option>
                <option value="xray">X-Ray</option>
                <option value="before_after">Before/After</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Image File *
              </label>
              <input
                type="file"
                accept="image/*"
                required
                onChange={handleFileSelect}
                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              {selectedFile && (
                <p className="text-sm text-secondary-600 mt-1">
                  Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={uploading || !selectedFile}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Upload Image'}
            </button>
          </form>
        </div>
      )}

      <div className="flex items-center gap-4 mb-4">
        <label className="text-sm font-medium text-secondary-700">Filter by type:</label>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="all">All Types</option>
          <option value="symptom">Symptoms</option>
          <option value="xray">X-Rays</option>
          <option value="before_after">Before/After</option>
          <option value="other">Other</option>
        </select>
      </div>

      {images.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-secondary-600">No images found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {images.map((image) => (
            <div
              key={image.id}
              className="bg-white rounded-lg shadow-md overflow-hidden border border-secondary-200"
            >
              <div className="aspect-video bg-secondary-100 flex items-center justify-center">
                {image.thumbnail_path ? (
                  <img
                    src={image.thumbnail_path}
                    alt={image.description || image.file_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-secondary-400">
                    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary-100 text-primary-700">
                    {getImageTypeLabel(image.image_type)}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-primary-700 mb-1">
                  {image.file_name}
                </h3>
                {image.description && (
                  <p className="text-sm text-secondary-600 mb-2">{image.description}</p>
                )}
                <div className="text-xs text-secondary-500">
                  {image.file_size && <p>Size: {formatFileSize(image.file_size)}</p>}
                  <p>Uploaded: {new Date(image.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

