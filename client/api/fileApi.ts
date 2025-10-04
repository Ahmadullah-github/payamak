// File API endpoints
import api from './apiClient';
import { handleApiError } from './apiClient';

export const fileApi = {
  // Get file info
  getFileInfo: (fileId: string) => api.get(`/files/info/${fileId}`),
  
  // Delete file
  deleteFile: (fileId: string) => api.delete(`/files/${fileId}`),
  
  // Get file URL for serving (robust join)
  getProfilePictureUrl: (filename: string) => {
    const base = new URL(api.defaults.baseURL || '', 'resolve://').toString().replace('resolve://', '');
    const origin = base.endsWith('/api') ? base.slice(0, -4) : base;
    return `${origin}/api/files/profiles/${encodeURIComponent(filename)}`;
  },
  getMediaFileUrl: (type: string, filename: string) => {
    // Expanded type mapping for comprehensive file support
    const typeMap: Record<string, string> = {
      // Media types
      image: 'images',
      video: 'videos',
      audio: 'audio',
      
      // Document types
      document: 'documents',
      file: 'documents', // Fallback for generic files
      
      // Office package files
      word: 'documents',
      excel: 'documents',
      powerpoint: 'documents',
      office: 'documents',
      
      // Other document types
      pdf: 'documents',
      text: 'documents',
      spreadsheet: 'documents',
      presentation: 'documents',
      
      // Archive files
      archive: 'archives',
      zip: 'archives',
      compressed: 'archives',
      
      // Code files
      code: 'code',
      script: 'code',
      
      // Add any other types as needed
    };
    
    const serverType = typeMap[type.toLowerCase()] || 'documents'; // Default to documents for unknown types
    
    const base = new URL(api.defaults.baseURL || '', 'resolve://').toString().replace('resolve://', '');
    const origin = base.endsWith('/api') ? base.slice(0, -4) : base;
    return `${origin}/api/files/media/${encodeURIComponent(serverType)}/${encodeURIComponent(filename)}`;
  },

  // Helper method to determine file type from extension
  getFileTypeFromExtension: (filename: string): string => {
    const extension = filename.toLowerCase().split('.').pop();
    
    const extensionMap: Record<string, string> = {
      // Images
      'jpg': 'image',
      'jpeg': 'image',
      'png': 'image',
      'gif': 'image',
      'bmp': 'image',
      'svg': 'image',
      'webp': 'image',
      'ico': 'image',
      'tiff': 'image',
      
      // Videos
      'mp4': 'video',
      'avi': 'video',
      'mov': 'video',
      'wmv': 'video',
      'flv': 'video',
      'webm': 'video',
      'mkv': 'video',
      'm4v': 'video',
      
      // Audio
      'mp3': 'audio',
      'wav': 'audio',
      'ogg': 'audio',
      'm4a': 'audio',
      'flac': 'audio',
      'aac': 'audio',
      
      // Microsoft Office
      'doc': 'word',
      'docx': 'word',
      'xls': 'excel',
      'xlsx': 'excel',
      'ppt': 'powerpoint',
      'pptx': 'powerpoint',
      
      // Other documents
      'pdf': 'pdf',
      'txt': 'text',
      'rtf': 'text',
      'csv': 'spreadsheet',
      'tsv': 'spreadsheet',
      
      // Archives
      'zip': 'archive',
      'rar': 'archive',
      '7z': 'archive',
      'tar': 'archive',
      'gz': 'archive',
      
      // Code files (optional - if you want to serve code files)
      'js': 'code',
      'ts': 'code',
      'html': 'code',
      'css': 'code',
      'py': 'code',
      'java': 'code',
      'cpp': 'code',
      'c': 'code',
      'php': 'code',
      'xml': 'code',
      'json': 'code',
    };
    
    return extensionMap[extension || ''] || 'file';
  },

  // Combined method that automatically detects file type
  getFileUrl: (filename: string) => {
    const fileType = fileApi.getFileTypeFromExtension(filename);
    return fileApi.getMediaFileUrl(fileType, filename);
  }
};