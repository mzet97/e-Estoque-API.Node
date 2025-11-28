import { EventEmitter } from 'events'
import { promises as fs } from 'fs'
import { join, dirname, extname, basename } from 'path'
import { v4 as uuidv4 } from 'uuid'
import { createReadStream, createWriteStream } from 'fs'

export interface FileStorageConfig {
  provider: 'local' | 's3' | 'gcs' | 'mock'
  local?: {
    basePath: string
    publicUrl?: string
  }
  s3?: {
    bucket: string
    region: string
    accessKeyId: string
    secretAccessKey: string
    publicUrl?: string
  }
  gcs?: {
    bucket: string
    projectId: string
    keyFilename: string
    publicUrl?: string
  }
  allowedMimeTypes?: string[]
  maxFileSize?: number
  defaultACL?: 'public-read' | 'private'
}

export interface FileUpload {
  originalName: string
  filename: string
  path: string
  size: number
  mimeType: string
  extension: string
  hash?: string
  metadata?: Record<string, any>
}

export interface FileMetadata {
  id: string
  filename: string
  originalName: string
  path: string
  size: number
  mimeType: string
  extension: string
  uploadedAt: Date
  lastAccessed: Date
  accessCount: number
  metadata: Record<string, any>
  url?: string
}

export interface StorageStats {
  totalFiles: number
  totalSize: number
  filesByType: Record<string, number>
  sizeByType: Record<string, number>
  uploadRate: number
  storageProvider: string
}

class FileStorageService extends EventEmitter {
  private config: FileStorageConfig
  private provider: any
  private fileMetadata: Map<string, FileMetadata> = new Map()

  constructor(config: FileStorageConfig) {
    super()
    this.config = {
      allowedMimeTypes: [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 'text/csv', 'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ],
      maxFileSize: 10 * 1024 * 1024, // 10MB
      defaultACL: 'private',
      ...config
    }

    this.initializeProvider()
  }

  private initializeProvider(): void {
    switch (this.config.provider) {
      case 'local':
        this.initializeLocalProvider()
        break
      case 's3':
        this.initializeS3Provider()
        break
      case 'gcs':
        this.initializeGCSProvider()
        break
      case 'mock':
        this.initializeMockProvider()
        break
      default:
        throw new Error(`Unsupported storage provider: ${this.config.provider}`)
    }
    console.log(`✅ File storage initialized with ${this.config.provider} provider`)
  }

  private initializeLocalProvider(): void {
    if (!this.config.local?.basePath) {
      throw new Error('Local storage base path is required')
    }

    this.provider = {
      async upload(file: Express.Multer.File, key: string): Promise<string> {
        // In a real implementation, you would copy the file to the local storage
        console.log(`📁 [Local] Would upload file to: ${key}`)
        return key
      },

      async download(key: string): Promise<NodeJS.ReadableStream> {
        // Mock implementation
        const stream = createReadStream('/dev/null')
        return stream
      },

      async delete(key: string): Promise<boolean> {
        console.log(`🗑️ [Local] Would delete file: ${key}`)
        return true
      },

      async getUrl(key: string): Promise<string> {
        const baseUrl = this.config.local?.publicUrl || 'http://localhost:3000/files'
        return `${baseUrl}/${key}`
      },

      async exists(key: string): Promise<boolean> {
        return true // Mock implementation
      }
    }
  }

  private initializeS3Provider(): void {
    if (!this.config.s3?.bucket || !this.config.s3.accessKeyId) {
      throw new Error('S3 configuration is incomplete')
    }

    // Mock S3 implementation
    this.provider = {
      async upload(file: Express.Multer.File, key: string): Promise<string> {
        console.log(`☁️ [S3] Would upload file to bucket: ${this.config.s3!.bucket}/${key}`)
        return key
      },

      async download(key: string): Promise<NodeJS.ReadableStream> {
        const stream = createReadStream('/dev/null')
        return stream
      },

      async delete(key: string): Promise<boolean> {
        console.log(`🗑️ [S3] Would delete file: ${key}`)
        return true
      },

      async getUrl(key: string): Promise<string> {
        const baseUrl = this.config.s3?.publicUrl || `https://${this.config.s3!.bucket}.s3.${this.config.s3!.region}.amazonaws.com`
        return `${baseUrl}/${key}`
      },

      async exists(key: string): Promise<boolean> {
        return true
      }
    }
  }

  private initializeGCSProvider(): void {
    if (!this.config.gcs?.bucket || !this.config.gcs.projectId) {
      throw new Error('GCS configuration is incomplete')
    }

    // Mock GCS implementation
    this.provider = {
      async upload(file: Express.Multer.File, key: string): Promise<string> {
        console.log(`☁️ [GCS] Would upload file to bucket: ${this.config.gcs!.bucket}/${key}`)
        return key
      },

      async download(key: string): Promise<NodeJS.ReadableStream> {
        const stream = createReadStream('/dev/null')
        return stream
      },

      async delete(key: string): Promise<boolean> {
        console.log(`🗑️ [GCS] Would delete file: ${key}`)
        return true
      },

      async getUrl(key: string): Promise<string> {
        const baseUrl = this.config.gcs?.publicUrl || `https://storage.googleapis.com/${this.config.gcs!.bucket}`
        return `${baseUrl}/${key}`
      },

      async exists(key: string): Promise<boolean> {
        return true
      }
    }
  }

  private initializeMockProvider(): void {
    this.provider = {
      async upload(file: Express.Multer.File, key: string): Promise<string> {
        console.log(`🎭 [MOCK] File uploaded: ${file.originalname} -> ${key}`)
        console.log(`🎭 [MOCK] File size: ${file.size} bytes`)
        console.log(`🎭 [MOCK] MIME type: ${file.mimetype}`)
        return key
      },

      async download(key: string): Promise<NodeJS.ReadableStream> {
        const stream = createReadStream('/dev/null')
        return stream
      },

      async delete(key: string): Promise<boolean> {
        console.log(`🎭 [MOCK] File deleted: ${key}`)
        return true
      },

      async getUrl(key: string): Promise<string> {
        return `https://mock-storage.example.com/${key}`
      },

      async exists(key: string): Promise<boolean> {
        return true
      }
    }
  }

  async uploadFile(
    file: Express.Multer.File, 
    options: {
      folder?: string
      filename?: string
      metadata?: Record<string, any>
      acl?: 'public-read' | 'private'
    } = {}
  ): Promise<FileUpload> {
    try {
      // Validate file
      await this.validateFile(file)

      // Generate filename if not provided
      const filename = options.filename || this.generateFilename(file.originalname)
      
      // Build storage key
      const folder = options.folder || this.getDefaultFolder(file.mimetype)
      const key = join(folder, filename)

      // Upload file to storage
      await this.provider.upload(file, key)

      // Create file metadata
      const fileMetadata: FileUpload = {
        originalName: file.originalname,
        filename,
        path: key,
        size: file.size,
        mimeType: file.mimetype,
        extension: extname(file.originalname).toLowerCase(),
        metadata: {
          ...options.metadata,
          uploadedAt: new Date().toISOString(),
          acl: options.acl || this.config.defaultACL
        }
      }

      // Store metadata
      await this.storeFileMetadata(fileMetadata)

      this.emit('fileUploaded', fileMetadata)
      console.log(`📁 File uploaded: ${file.originalname} -> ${key}`)

      return fileMetadata

    } catch (error) {
      console.error('File upload error:', error)
      this.emit('fileUploadError', error, file)
      throw error
    }
  }

  async uploadMultipleFiles(
    files: Express.Multer.File[],
    options: {
      folder?: string
      metadata?: Record<string, any>
      acl?: 'public-read' | 'private'
    } = {}
  ): Promise<FileUpload[]> {
    const results: FileUpload[] = []
    
    for (const file of files) {
      try {
        const result = await this.uploadFile(file, options)
        results.push(result)
      } catch (error) {
        console.error(`Failed to upload file ${file.originalname}:`, error)
        results.push({
          originalName: file.originalname,
          filename: '',
          path: '',
          size: 0,
          mimeType: file.mimetype,
          extension: extname(file.originalname).toLowerCase()
        })
      }
    }

    return results
  }

  async downloadFile(key: string): Promise<NodeJS.ReadableStream> {
    try {
      const stream = await this.provider.download(key)
      this.emit('fileDownloaded', key)
      return stream
    } catch (error) {
      console.error('File download error:', error)
      throw error
    }
  }

  async deleteFile(key: string): Promise<boolean> {
    try {
      const deleted = await this.provider.delete(key)
      
      if (deleted) {
        // Remove from metadata
        this.fileMetadata.delete(key)
        
        // Remove from Redis if needed
        await this.removeFileMetadata(key)
        
        this.emit('fileDeleted', key)
        console.log(`🗑️ File deleted: ${key}`)
      }

      return deleted
    } catch (error) {
      console.error('File deletion error:', error)
      this.emit('fileDeleteError', error, key)
      return false
    }
  }

  async getFileUrl(key: string, options?: { expiresIn?: number }): Promise<string> {
    try {
      const url = await this.provider.getUrl(key)
      return url
    } catch (error) {
      console.error('Error getting file URL:', error)
      throw error
    }
  }

  async getFileMetadata(key: string): Promise<FileMetadata | null> {
    try {
      return this.fileMetadata.get(key) || null
    } catch (error) {
      console.error('Error getting file metadata:', error)
      return null
    }
  }

  async updateFileMetadata(key: string, metadata: Record<string, any>): Promise<boolean> {
    try {
      const existing = this.fileMetadata.get(key)
      if (!existing) {
        return false
      }

      const updated: FileMetadata = {
        ...existing,
        metadata: { ...existing.metadata, ...metadata },
        lastAccessed: new Date()
      }

      this.fileMetadata.set(key, updated)
      await this.storeFileMetadata(updated)

      this.emit('fileMetadataUpdated', updated)
      return true
    } catch (error) {
      console.error('Error updating file metadata:', error)
      return false
    }
  }

  // Utility methods
  private async validateFile(file: Express.Multer.File): Promise<void> {
    // Check file size
    if (file.size > this.config.maxFileSize!) {
      throw new Error(`File size exceeds maximum allowed size of ${this.config.maxFileSize} bytes`)
    }

    // Check MIME type
    if (this.config.allowedMimeTypes && !this.config.allowedMimeTypes.includes(file.mimetype)) {
      throw new Error(`File type ${file.mimetype} is not allowed`)
    }
  }

  private generateFilename(originalName: string): string {
    const extension = extname(originalName)
    const baseName = basename(originalName, extension)
    const uniqueId = uuidv4()
    const sanitizedBaseName = baseName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
    
    return `${sanitizedBaseName}-${uniqueId}${extension}`
  }

  private getDefaultFolder(mimeType: string): string {
    if (mimeType.startsWith('image/')) {
      return 'images'
    } else if (mimeType === 'application/pdf') {
      return 'documents'
    } else if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
      return 'spreadsheets'
    } else if (mimeType.includes('word') || mimeType.includes('document')) {
      return 'documents'
    } else {
      return 'misc'
    }
  }

  private async storeFileMetadata(fileMetadata: FileUpload): Promise<void> {
    const metadata: FileMetadata = {
      id: uuidv4(),
      filename: fileMetadata.filename,
      originalName: fileMetadata.originalName,
      path: fileMetadata.path,
      size: fileMetadata.size,
      mimeType: fileMetadata.mimeType,
      extension: fileMetadata.extension,
      uploadedAt: new Date(),
      lastAccessed: new Date(),
      accessCount: 0,
      metadata: fileMetadata.metadata || {}
    }

    this.fileMetadata.set(fileMetadata.path, metadata)
    
    // In a real implementation, you would store this in a database
    console.log(`📊 Stored metadata for file: ${fileMetadata.filename}`)
  }

  private async removeFileMetadata(key: string): Promise<void> {
    // In a real implementation, you would remove from database
    console.log(`📊 Removed metadata for file: ${key}`)
  }

  // Statistics and monitoring
  async getStatistics(): Promise<StorageStats> {
    const stats: StorageStats = {
      totalFiles: this.fileMetadata.size,
      totalSize: 0,
      filesByType: {},
      sizeByType: {},
      uploadRate: 0,
      storageProvider: this.config.provider
    }

    for (const metadata of this.fileMetadata.values()) {
      stats.totalSize += metadata.size
      
      // Count by type
      const type = metadata.mimeType.split('/')[0] || 'unknown'
      stats.filesByType[type] = (stats.filesByType[type] || 0) + 1
      stats.sizeByType[type] = (stats.sizeByType[type] || 0) + metadata.size
    }

    return stats
  }

  async getFilesByType(mimeType: string): Promise<FileMetadata[]> {
    return Array.from(this.fileMetadata.values())
      .filter(metadata => metadata.mimeType === mimeType)
  }

  async getFilesByFolder(folder: string): Promise<FileMetadata[]> {
    return Array.from(this.fileMetadata.values())
      .filter(metadata => metadata.path.startsWith(folder))
  }

  // Health checks
  async isHealthy(): Promise<boolean> {
    try {
      // Test provider connectivity
      return await this.provider.exists('health-check')
    } catch (error) {
      return false
    }
  }

  // Utility methods for external use
  static getAllowedMimeTypes(): string[] {
    return [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/csv', 'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
  }

  static getMaxFileSize(): number {
    return 10 * 1024 * 1024 // 10MB
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
}

export default FileStorageService