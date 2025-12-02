'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import apiClient from '@/lib/utils/apiClient';

export default function DocumentsPage() {
  const { user, loading: authLoading } = useAuth(true);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    documentType: 'other',
    description: '',
    appointmentId: '',
  });
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    if (!authLoading && user) {
      fetchDocuments();
    }
  }, [authLoading, user, filterType]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const url = filterType !== 'all' 
        ? `/api/documents?type=${filterType}`
        : '/api/documents';
      const response = await apiClient.get(url);
      if (response.data.success) {
        setDocuments(response.data.data.documents || []);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
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
      const filePath = `/uploads/${user?.id}/${Date.now()}_${selectedFile.name}`;
      
      const payload: any = {
        documentType: formData.documentType,
        fileName: selectedFile.name,
        filePath: filePath,
        fileSize: selectedFile.size,
        mimeType: selectedFile.type,
      };
      
      if (formData.description) payload.description = formData.description;
      if (formData.appointmentId) payload.appointmentId = parseInt(formData.appointmentId);

      const response = await apiClient.post('/api/documents', payload);
      if (response.data.success) {
        setShowUploadForm(false);
        setSelectedFile(null);
        setFormData({
          documentType: 'other',
          description: '',
          appointmentId: '',
        });
        fetchDocuments();
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      await apiClient.delete(`/api/documents/${id}`);
      fetchDocuments();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete document');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      receipt: 'Receipt',
      xray: 'X-Ray',
      treatment_plan: 'Treatment Plan',
      prescription: 'Prescription',
      form: 'Form',
      other: 'Other',
    };
    return labels[type] || type;
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-secondary-600">Loading documents...</div>
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
            Documents
          </h1>
          <p className="text-secondary-600 mt-2">
            View and manage your dental documents
          </p>
        </div>
        <button
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          {showUploadForm ? 'Cancel' : 'Upload Document'}
        </button>
      </div>

      {showUploadForm && (
        <div className="bg-white rounded-lg shadow-md p-6 border border-secondary-200">
          <h2 className="text-xl font-semibold text-primary-700 mb-4">
            Upload Document
          </h2>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Document Type *
              </label>
              <select
                required
                value={formData.documentType}
                onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="receipt">Receipt</option>
                <option value="xray">X-Ray</option>
                <option value="treatment_plan">Treatment Plan</option>
                <option value="prescription">Prescription</option>
                <option value="form">Form</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                File *
              </label>
              <input
                type="file"
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
              {uploading ? 'Uploading...' : 'Upload Document'}
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
          <option value="receipt">Receipts</option>
          <option value="xray">X-Rays</option>
          <option value="treatment_plan">Treatment Plans</option>
          <option value="prescription">Prescriptions</option>
          <option value="form">Forms</option>
          <option value="other">Other</option>
        </select>
      </div>

      {documents.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-secondary-600">No documents found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-lg shadow-md p-6 border border-secondary-200"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-primary-700 mb-1">
                    {doc.file_name}
                  </h3>
                  <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-primary-100 text-primary-700 mb-2">
                    {getDocumentTypeLabel(doc.document_type)}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="text-red-600 hover:text-red-700"
                  title="Delete document"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              {doc.description && (
                <p className="text-sm text-secondary-600 mb-2">{doc.description}</p>
              )}
              <div className="text-xs text-secondary-500 space-y-1">
                {doc.file_size && <p>Size: {formatFileSize(doc.file_size)}</p>}
                <p>Uploaded: {new Date(doc.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

